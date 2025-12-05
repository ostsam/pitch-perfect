"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileUpload } from "@/components/file-upload";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Aperture } from "lucide-react";
import { Orb } from "@/components/orb";
import { CameraFeed } from "@/components/camera-feed";
import { cn } from "@/lib/utils";
import type { FaceData } from "@/hooks/use-face-detection";

export interface RoastMessage {
	id: string;
	text: string;
	severity: "info" | "warning" | "critical";
	timestamp: number;
}

const PdfViewer = dynamic(
	() => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
	{
		ssr: false,
		loading: () => null,
	}
);

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [isRoasting, setIsRoasting] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [micVolume, setMicVolume] = useState(0);
	const [showCamera, setShowCamera] = useState(false);

	// State for the "Brain"
	const [currentFaceData, setCurrentFaceData] = useState<FaceData | null>(null); // For UI rendering
	const pdfTextRef = useRef<string>(""); // Ref for the interval to access fresh data
	const pageTextsRef = useRef<string[]>([]);
	const deckSummaryRef = useRef<string>("");
	const currentPageRef = useRef<number>(1);
	const roastsRef = useRef<RoastMessage[]>([]);
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
	const faceDataRef = useRef<FaceData | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
	const rafRef = useRef<number | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);

	// Connection refs
	const socketRef = useRef<WebSocket | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

	useEffect(() => {
		setMounted(true);
		audioRef.current = new Audio();
	}, []);

	// 1. Handle PDF Upload & Text Extraction
	useEffect(() => {
		if (!file) {
			pdfTextRef.current = "";
			pageTextsRef.current = [];
			deckSummaryRef.current = "";
			return;
		}

		const extractPdfText = async () => {
			const formData = new FormData();
			formData.append("file", file);

			try {
				const res = await fetch("/api/process-pdf", {
					method: "POST",
					body: formData,
				});
				const data = await res.json();
				if (data.text) {
					pdfTextRef.current = data.text; // full deck text
					deckSummaryRef.current = data.summary || data.text.slice(0, 1200);
					console.log(
						"📄 PDF Context Loaded:",
						data.text.slice(0, 100) + "..."
					);
				}
				if (Array.isArray(data.pages)) {
					pageTextsRef.current = data.pages;
				}
			} catch (error) {
				console.error("Failed to extract PDF text:", error);
			}
		};

		extractPdfText();
	}, [file]);

	const stopAudioAnalysis = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		if (audioContextRef.current) {
			audioContextRef.current.close().catch(() => {});
			audioContextRef.current = null;
		}
		analyserRef.current = null;
		dataArrayRef.current = null;
		setMicVolume(0);
	}, []);

	const startAudioAnalysis = useCallback(
		(stream: MediaStream) => {
			// Defensive cleanup before starting
			stopAudioAnalysis();

			const audioCtxConstructor =
				window.AudioContext ||
				(window as typeof window & { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!audioCtxConstructor) return;
			const audioCtx = new audioCtxConstructor();
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 512;
			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(
				new ArrayBuffer(bufferLength)
			) as Uint8Array<ArrayBuffer>;

			const source = audioCtx.createMediaStreamSource(stream);
			source.connect(analyser);

			audioContextRef.current = audioCtx;
			analyserRef.current = analyser;
			dataArrayRef.current = dataArray;

			const updateVolume = () => {
				if (!analyserRef.current || !dataArrayRef.current) return;
				analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

				// Compute RMS from time-domain data (0-255), normalize to 0..1
				let sumSquares = 0;
				for (let i = 0; i < dataArrayRef.current.length; i++) {
					const v = (dataArrayRef.current[i] - 128) / 128; // center to -1..1
					sumSquares += v * v;
				}
				const rms = Math.sqrt(sumSquares / dataArrayRef.current.length);
				setMicVolume(Math.min(1, rms * 2)); // scale a bit for visual pop

				rafRef.current = requestAnimationFrame(updateVolume);
			};

			rafRef.current = requestAnimationFrame(updateVolume);
		},
		[stopAudioAnalysis]
	);

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

		// Add to UI
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
			partialCacheRef.current = "";
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
			lastAnalyzedLenRef.current = transcriptRef.current.length;
			lastConsumedIdxRef.current = transcriptRef.current.length;
		}
	}, [triggerRoast]);

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
		[analyzePitch]
	);

	const startUtteranceTimer = useCallback(
		(delayMs = 1200) => {
			clearUtteranceTimer();
			utteranceTimerRef.current = setTimeout(() => {
				utteranceTimerRef.current = null;
				scheduleAnalysis(0);
			}, delayMs);
		},
		[clearUtteranceTimer, scheduleAnalysis]
	);

	// 2. Deepgram & Microphone Setup
	useEffect(() => {
		if (!isRoasting || !file) {
			// Cleanup
			socketRef.current?.close();
			mediaRecorderRef.current?.stop();
			return;
		}

		const startSession = async () => {
			try {
				// A. Get Token
				const tokenRes = await fetch("/api/get-deepgram-token");
				const { key } = await tokenRes.json();

				if (!key) throw new Error("No Deepgram key");

				// B. Setup WebSocket
				const socket = new WebSocket(
					"wss://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=en-US",
					["token", key]
				);

				socket.onopen = () => {
					console.log("🟢 Connected to Deepgram");

					// C. Start Microphone
					navigator.mediaDevices
						.getUserMedia({ audio: true })
						.then((stream) => {
							micStreamRef.current = stream;
							startAudioAnalysis(stream);

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

					// Trigger analysis: immediate if long enough, otherwise debounce and timer
					if (utteranceBufferRef.current.trim().length >= 80) {
						scheduleAnalysis(0);
					} else {
						scheduleAnalysis(0);
					}

					// Restart utterance end timer to detect pauses
					startUtteranceTimer(1300);
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
			stopAudioAnalysis();
			micStreamRef.current?.getTracks().forEach((track) => track.stop());
			clearAnalysisDebounce();
			clearUtteranceTimer();
		};
	}, [
		analyzePitch,
		isRoasting,
		file,
		startAudioAnalysis,
		stopAudioAnalysis,
		clearAnalysisDebounce,
		scheduleAnalysis,
		clearUtteranceTimer,
		startUtteranceTimer,
	]);

	const handleFaceData = (data: FaceData | null) => {
		faceDataRef.current = data;
		setCurrentFaceData(data);
	};

	const handlePageChange = (page: number) => {
		currentPageRef.current = page;
	};

	if (!mounted) return null;

	return (
		<main className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col selection:bg-white/20">
			{/* Ambient Background Mesh */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/05 blur-[150px] animate-pulse duration-10000ms" />
			</div>

			{/* Navbar */}
			<motion.header
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="relative z-50 flex-none px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm"
			>
				<div
					className="flex items-center gap-3 cursor-pointer"
					onClick={() => {
						setFile(null);
						setIsRoasting(false);
					}}
				>
					<div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
						<Aperture className="w-3 h-3 text-white" />
					</div>
					<span className="font-medium text-sm tracking-wide text-zinc-300">
						Pitch Perfect
					</span>
				</div>

				{file && (
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsRoasting(!isRoasting)}
							className={cn(
								"px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2",
								isRoasting
									? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
									: "bg-white text-black hover:bg-zinc-200"
							)}
						>
							{isRoasting ? "Live Session" : "Start Session"}
						</button>
						<button
							onClick={() => setShowCamera((prev) => !prev)}
							className={cn(
								"px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all flex items-center gap-2 border border-white/10",
								showCamera
									? "bg-white text-black hover:bg-zinc-200"
									: "bg-black/40 text-white hover:bg-white/10"
							)}
						>
							{showCamera ? "Hide Camera" : "Show Camera"}
						</button>
					</div>
				)}
			</motion.header>

			{/* Content Stage */}
			<div className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
				<AnimatePresence mode="wait">
					{!file ? (
						<motion.div
							key="hero"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
							transition={{ duration: 0.5 }}
							className="flex-1 flex flex-col items-center justify-center p-6 relative min-h-0 overflow-auto"
						>
							<div className="text-center space-y-6 max-w-4xl mb-12 relative z-20">
								<motion.h1
									initial={{ y: 20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/40"
								>
									Pitch like your life depends on it.
								</motion.h1>
							</div>

							<motion.div
								initial={{ y: 40, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2 }}
								className="w-full max-w-xl relative z-20"
							>
								<FileUpload onFileSelect={setFile} />
							</motion.div>
						</motion.div>
					) : (
						<motion.div
							key="workspace"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex-1 flex flex-row gap-4 p-6 min-h-0 overflow-hidden"
						>
							{/* PDF takes majority / full width */}
							<div className="relative flex-1 h-full min-h-0 rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-2xl">
								<PdfViewer file={file} onPageChange={handlePageChange} />
								{/* Docked mini orb + status (stacked) */}
								<div className="pointer-events-none absolute bottom-0.5 right-12 flex flex-col items-center gap-2 w-20">
									<div className="pointer-events-none flex items-center justify-center w-16 h-16 rounded-full bg-black/50 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
										<Orb
											active={isRoasting}
											volume={micVolume}
											sizeClass="w-12 h-12"
										/>
									</div>
									<div className="pointer-events-none px-2 py-1 rounded-full bg-black/60 border border-white/10 shadow-sm text-[10px] font-mono uppercase tracking-wide text-zinc-200 w-full text-center">
										{isRoasting ? "Listening" : "Idle"}
									</div>
								</div>
							</div>

							{/* Camera panel toggled */}
							{showCamera && (
								<div className="w-[280px] flex-none h-full min-h-0 flex flex-col gap-4 overflow-hidden">
									<div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative">
										<CameraFeed active={true} onFaceData={handleFaceData} />
									</div>

									{/* Face Analysis Debug */}
									<div className="h-1/3 relative rounded-2xl border border-white/5 bg-white/2 overflow-hidden">
										<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50 pointer-events-none z-10" />
										<div className="h-full flex flex-col p-4">
											<h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3 border-b border-white/5 pb-2 flex-none">
												Face Analysis Debug
											</h3>

											{currentFaceData ? (
												<div className="flex-1 overflow-auto space-y-2 text-xs font-mono">
													<div className="flex justify-between items-center">
														<span className="text-zinc-400">Emotion:</span>
														<span className="text-white font-bold capitalize">
															{currentFaceData.dominantEmotion}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-zinc-400">Confidence:</span>
														<span className="text-green-400">
															{(currentFaceData.confidence * 100).toFixed(0)}%
														</span>
													</div>
													<div className="mt-3 pt-3 border-t border-white/5">
														<div className="text-zinc-500 mb-2 text-[10px]">
															All Emotions:
														</div>
														{Object.entries(currentFaceData.emotions)
															.sort(([, a], [, b]) => b - a)
															.slice(0, 4)
															.map(([emotion, value]) => (
																<div
																	key={emotion}
																	className="flex justify-between items-center mb-1"
																>
																	<span className="text-zinc-500 capitalize text-[11px]">
																		{emotion}:
																	</span>
																	<div className="flex items-center gap-2">
																		<div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
																			<div
																				className="h-full bg-blue-500 rounded-full transition-all"
																				style={{ width: `${value * 100}%` }}
																			/>
																		</div>
																		<span className="text-zinc-400 text-[10px] w-8 text-right">
																			{(value * 100).toFixed(0)}%
																		</span>
																	</div>
																</div>
															))}
													</div>
												</div>
											) : (
												<div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
													No face detected
												</div>
											)}
										</div>
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
