"use client";

import { useRef, useEffect, useCallback, MutableRefObject } from "react";
import type { FaceData } from "@/hooks/use-face-detection";

export interface RoastMessage {
  id: string;
  text: string;
  severity: "info" | "warning" | "critical";
  timestamp: number;
}

interface UseRoastSessionProps {
  file: File | null;
  isRoasting: boolean;
  setIsRoasting: (isRoasting: boolean) => void;
  pdfTextRef: MutableRefObject<string>;
  pageTextsRef: MutableRefObject<string[]>;
  deckSummaryRef: MutableRefObject<string>;
  faceDataRef: MutableRefObject<FaceData | null>;
  currentPageRef: MutableRefObject<number>;
  onMicStreamCreated?: (stream: MediaStream) => void;
  onSessionEnd?: () => void;
}

export function useRoastSession({
  file,
  isRoasting,
  setIsRoasting,
  pdfTextRef,
  pageTextsRef,
  deckSummaryRef,
  faceDataRef,
  currentPageRef,
  onMicStreamCreated,
  onSessionEnd,
}: UseRoastSessionProps) {
  const roastsRef = useRef<RoastMessage[]>([]);
  // Expose roasts as state for UI rendering if needed, but Page only renders them?
  // Actually Page doesn't render roasts list in the provided code...
  // Wait, let me check page.tsx again.
  // It triggers roast and adds to roastsRef. Does it render them?
  // I don't see where it renders roastsRef.current.map...
  // Ah, inside `analyzePitch` it passes `previousRoasts: roastsRef.current.map(...)`.
  // But the UI doesn't seem to display the list of past roasts, only plays audio.
  // Unless I missed it.
  // Checking page.tsx again...
  // It doesn't render the list visually. It just stores them for context.
  // So I don't need to expose a state for roasts, just keep the ref logic.

  const isAnalyzingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isSpeechPendingRef = useRef<boolean>(false);
  const speechTimeoutRef = useRef<number | null>(null);
  const analysisDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>("");
  const lastConsumedIdxRef = useRef<number>(0);
  const lastAnalyzedLenRef = useRef<number>(0);
  const lastAnalysisAtRef = useRef<number>(0);
  const lastRoastAtRef = useRef<number>(0);
  const partialCacheRef = useRef<string>("");
  const utteranceBufferRef = useRef<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Connection refs
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  const clearSpeechTimeout = () => {
    if (speechTimeoutRef.current !== null) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };

  const clearAnalysisDebounce = useCallback(() => {
    if (analysisDebounceRef.current) {
      clearTimeout(analysisDebounceRef.current);
      analysisDebounceRef.current = null;
    }
  }, []);

  const clearUtteranceTimer = useCallback(() => {
    if (utteranceTimerRef.current) {
      clearTimeout(utteranceTimerRef.current);
      utteranceTimerRef.current = null;
    }
  }, []);

  const triggerRoast = useCallback(async (text: string) => {
    // Block additional roasts immediately (before network/stream starts)
    isSpeechPendingRef.current = true;
    clearSpeechTimeout();
    speechTimeoutRef.current = window.setTimeout(() => {
      // Fail-safe: if playback never starts, unblock analysis
      isSpeechPendingRef.current = false;
      isSpeakingRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }, 3000);

    console.log("🔥 ROAST TRIGGERED:", text);

    // Add to UI (Internal Ref)
    const newRoast: RoastMessage = {
      id: Date.now().toString(),
      text,
      severity: "critical",
      timestamp: Date.now(),
    };
    roastsRef.current = [...roastsRef.current, newRoast];

    // Play Audio (streaming with brief buffer for stability)
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      if (!res.ok || !res.body) {
        throw new Error("No audio stream");
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audioEl = audioRef.current;
      const mimeType = "audio/mpeg";
      const supportsMSE =
        typeof MediaSource !== "undefined" &&
        MediaSource.isTypeSupported &&
        MediaSource.isTypeSupported(mimeType);

      if (!supportsMSE) {
        // Fallback: blob (non-streaming) to avoid runtime errors on unsupported browsers
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioEl.src = url;
        isSpeakingRef.current = true;
        audioEl.onended = () => {
          isSpeakingRef.current = false;
          isSpeechPendingRef.current = false;
          clearSpeechTimeout();
          URL.revokeObjectURL(url);
        };
        audioEl.onpause = () => {
          // Attempt to resume if paused unexpectedly
          if (audioEl.paused && !audioEl.ended) {
            audioEl.play().catch(() => {
              /* swallow */
            });
          }
        };
        audioEl.play().catch(() => {
          isSpeakingRef.current = false;
          isSpeechPendingRef.current = false;
          clearSpeechTimeout();
          URL.revokeObjectURL(url);
        });
      } else {
        const mediaSource = new MediaSource();
        const objectUrl = URL.createObjectURL(mediaSource);
        audioEl.src = objectUrl;

        const cleanSpeakingFlags = () => {
          isSpeakingRef.current = false;
          isSpeechPendingRef.current = false;
          clearSpeechTimeout();
          audioEl.onended = null;
          audioEl.onpause = null;
          URL.revokeObjectURL(objectUrl);
        };

        audioEl.onended = cleanSpeakingFlags;
        audioEl.onpause = () => {
          // If paused unexpectedly, attempt to resume instead of treating as end
          if (audioEl.paused && !audioEl.ended) {
            audioEl.play().catch(() => {
              /* swallow */
            });
          }
        };

        mediaSource.addEventListener("sourceopen", () => {
          let sourceBuffer: SourceBuffer;
          try {
            sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          } catch (e) {
            console.error("SourceBuffer init failed, falling back to blob", e);
            mediaSource.endOfStream();
            URL.revokeObjectURL(objectUrl);
            res.blob().then((blob) => {
              const url = URL.createObjectURL(blob);
              audioEl.src = url;
              isSpeakingRef.current = true;
              audioEl.play().catch(() => {
                isSpeakingRef.current = false;
                isSpeechPendingRef.current = false;
                clearSpeechTimeout();
                URL.revokeObjectURL(url);
              });
            });
            return;
          }

          const reader = res.body!.getReader();

          const queue: Uint8Array[] = [];
          let appending = false;
          let done = false;
          let started = false;

          const appendNext = () => {
            if (appending) return;
            const chunk = queue.shift();
            if (!chunk) {
              if (done && !appending && mediaSource.readyState === "open") {
                try {
                  mediaSource.endOfStream();
                } catch {
                  /* noop */
                }
              }
              return;
            }
            appending = true;
            const safeChunk = new Uint8Array(chunk); // ensure non-shared buffer
            sourceBuffer.appendBuffer(safeChunk);
          };

          sourceBuffer.addEventListener("updateend", () => {
            appending = false;
            appendNext();
          });

          const pump = async () => {
            try {
              while (true) {
                const { value, done: streamDone } = await reader.read();
                if (value) {
                  queue.push(value);
                  if (!started) {
                    started = true;
                    // brief buffer (~0.25s) before play for stability
                    setTimeout(() => {
                      if (audioEl && !audioEl.paused) return;
                      isSpeakingRef.current = true;
                      isSpeechPendingRef.current = false;
                      clearSpeechTimeout();
                      audioEl.play().catch(() => {
                        isSpeakingRef.current = false;
                        isSpeechPendingRef.current = false;
                        clearSpeechTimeout();
                      });
                    }, 500);
                  }
                  appendNext();
                }
                if (streamDone) {
                  done = true;
                  appendNext();
                  break;
                }
              }
            } catch (err) {
              console.error("Stream read error:", err);
              try {
                mediaSource.endOfStream();
              } catch {
                /* noop */
              }
              cleanSpeakingFlags();
            }
          };

          pump();
        });
      }

      // Clear transcript buffer so we don't re-analyze old mistakes
      transcriptRef.current = "";
      // Record roast time and reset transcript buffer so we don't re-analyze old text
      lastRoastAtRef.current = Date.now();
      transcriptRef.current = "";
      lastConsumedIdxRef.current = 0;
      lastAnalyzedLenRef.current = 0;
      utteranceBufferRef.current = "";
      // partialCacheRef.current = ""; // Do NOT clear partial cache; Deepgram's current utterance is still active/cumulative.
    } catch (error) {
      console.error("Failed to speak:", error);
      isSpeakingRef.current = false;
      isSpeechPendingRef.current = false;
      clearSpeechTimeout();
    }
  }, []);

  const analyzePitch = useCallback(async () => {
    // Don't interrupt if already speaking
    if (isSpeakingRef.current || isSpeechPendingRef.current) return;
    if (audioRef.current && !audioRef.current.paused) return;
    if (isAnalyzingRef.current) return;

    // Enforce minimum interval between analyses
    const now = Date.now();
    const minIntervalMs = 1500;
    if (now - lastAnalysisAtRef.current < minIntervalMs) return;

    // Only analyze new transcript since last pass
    const fullTranscript = transcriptRef.current;
    if (fullTranscript.length <= lastAnalyzedLenRef.current) return;

    const transcriptDelta = fullTranscript.slice(lastConsumedIdxRef.current);
    if (!transcriptDelta.trim() && !faceDataRef.current) return; // Nothing new

    // Require a minimal utterance length to avoid fragmentary roasts
    const minChars = 24;
    if (transcriptDelta.trim().length < minChars && !faceDataRef.current)
      return;

    const transcript = transcriptDelta.slice(-500); // focus on recent delta
    const faceData = faceDataRef.current;
    const currentPdfText = pdfTextRef.current; // full deck
    const pageText = pageTextsRef.current[currentPageRef.current - 1] || "";
    const deckSummary =
      deckSummaryRef.current ||
      (currentPdfText ? currentPdfText.slice(0, 1200) : "");

    // Capture the length we are about to process to avoid race conditions
    const processedLength = fullTranscript.length;

    // If no PDF text yet, we can't really judge context, but we can judge emotion.
    // However, the API requires pdfContext.
    if (!currentPdfText && !pageText && !deckSummary) {
      console.log("Waiting for PDF text...");
      return;
    }

    if (!transcript.trim() && !faceData) return; // Nothing to analyze

    // Cool-down after a roast
    const roastCooldownMs = 3000;
    if (now - lastRoastAtRef.current < roastCooldownMs) return;

    // Format emotion string
    let emotionData = "No face detected";
    if (faceData) {
      emotionData = `Dominant: ${faceData.dominantEmotion} (${(
        faceData.confidence * 100
      ).toFixed(0)}%)`;
      // Add top 2 secondary emotions
      const secondary = Object.entries(faceData.emotions)
        .sort(([, a], [, b]) => b - a)
        .slice(1, 3)
        .map(([e, v]) => `${e} (${(v * 100).toFixed(0)}%)`)
        .join(", ");
      if (secondary) emotionData += ` | Secondary: ${secondary}`;
    }

    try {
      isAnalyzingRef.current = true;
      const res = await fetch("/api/analyze-pitch", {
        method: "POST",
        body: JSON.stringify({
          transcript,
          emotionData,
          pageText,
          deckSummary,
          previousRoasts: roastsRef.current.map((r) => r.text),
        }),
      });

      const result = await res.json();

      if (result.shouldInterrupt && result.roastMessage) {
        triggerRoast(result.roastMessage);
      }
    } catch (error) {
      console.error("Brain glitch:", error);
    } finally {
      isAnalyzingRef.current = false;
      lastAnalysisAtRef.current = Date.now();
      lastAnalyzedLenRef.current = processedLength;
      lastConsumedIdxRef.current = processedLength;
    }
  }, [
    triggerRoast,
    pdfTextRef,
    pageTextsRef,
    deckSummaryRef,
    faceDataRef,
    currentPageRef,
  ]);

  const scheduleAnalysis = useCallback(
    (delayMs = 0) => {
      if (analysisDebounceRef.current) {
        clearTimeout(analysisDebounceRef.current);
      }
      analysisDebounceRef.current = setTimeout(() => {
        analysisDebounceRef.current = null;
        analyzePitch();
      }, delayMs);
    },
    [analyzePitch],
  );

  const startUtteranceTimer = useCallback(
    (delayMs = 1200) => {
      clearUtteranceTimer();
      utteranceTimerRef.current = setTimeout(() => {
        utteranceTimerRef.current = null;
        scheduleAnalysis(0);
      }, delayMs);
    },
    [clearUtteranceTimer, scheduleAnalysis],
  );

  // Deepgram & Microphone Setup
  useEffect(() => {
    if (!isRoasting || !file) {
      // Cleanup
      socketRef.current?.close();
      mediaRecorderRef.current?.stop();
      return;
    }

    // Browser Audio Capability Check
    const checkAudioSupport = () => {
      const opusSupported = MediaSource.isTypeSupported(
        'audio/webm; codecs="opus"',
      );
      const mp3Supported = MediaSource.isTypeSupported("audio/mpeg");
      console.log("🎧 Audio Support:", {
        opus: opusSupported,
        mp3: mp3Supported,
      });
    };
    checkAudioSupport();

    const startSession = async () => {
      try {
        // A. Get Token
        const tokenRes = await fetch("/api/get-deepgram-token");
        const { key } = await tokenRes.json();

        if (!key) throw new Error("No Deepgram key");

        // B. Setup WebSocket
        const socket = new WebSocket(
          "wss://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=en-US",
          ["token", key],
        );

        socket.onopen = () => {
          console.log("🟢 Connected to Deepgram");

          // C. Start Microphone
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
              micStreamRef.current = stream;
              if (onMicStreamCreated) {
                onMicStreamCreated(stream);
              }

              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;

              mediaRecorder.addEventListener("dataavailable", (event) => {
                if (event.data.size > 0 && socket.readyState === 1) {
                  socket.send(event.data);
                }
              });

              mediaRecorder.start(100); // Send chunks every ~100ms for lower latency
            });
        };

        socket.onmessage = (message) => {
          const received = JSON.parse(message.data);
          const alt = received.channel?.alternatives?.[0];
          const transcript = alt?.transcript?.trim();
          if (!transcript) return;

          const isFinal = !!received.is_final;

          // Compute delta against prior partial to avoid duplicate text from cumulative hypotheses
          let delta = transcript;
          const lastPartial = partialCacheRef.current;
          if (!isFinal && lastPartial && transcript.startsWith(lastPartial)) {
            delta = transcript.slice(lastPartial.length);
          } else if (
            isFinal &&
            lastPartial &&
            transcript.startsWith(lastPartial)
          ) {
            delta = transcript.slice(lastPartial.length);
          }

          if (!isFinal) {
            partialCacheRef.current = transcript;
          } else {
            partialCacheRef.current = "";
          }

          if (delta.trim()) {
            utteranceBufferRef.current += utteranceBufferRef.current
              ? " " + delta
              : delta;
            transcriptRef.current = utteranceBufferRef.current;
          }

          // Smart Analysis Scheduling:
          // 1. If punctuation detected in delta, likely end of sentence -> Analyze
          // 2. If buffer is getting long (> 150 chars), catch rambling -> Analyze
          // 3. Otherwise, wait for silence (utterance timer)
          const hasPunctuation = /[.!?]/.test(delta);
          const isLongBuffer =
            utteranceBufferRef.current.length - lastAnalyzedLenRef.current >
            150;

          if (hasPunctuation || isLongBuffer) {
            scheduleAnalysis(0);
          }

          // Restart utterance end timer to detect pauses (silence)
          startUtteranceTimer(2000);
        };

        socketRef.current = socket;
      } catch (error) {
        console.error("Failed to start session:", error);
        setIsRoasting(false);
      }
    };

    startSession();

    return () => {
      socketRef.current?.close();
      mediaRecorderRef.current?.stop();
      if (onSessionEnd) onSessionEnd();
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      clearAnalysisDebounce();
      clearUtteranceTimer();
    };
  }, [
    isRoasting,
    file,
    setIsRoasting,
    onMicStreamCreated,
    clearAnalysisDebounce,
    scheduleAnalysis,
    clearUtteranceTimer,
    startUtteranceTimer,
    onSessionEnd,
  ]);
}
