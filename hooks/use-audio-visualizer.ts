"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useAudioVisualizer() {
  const [micVolume, setMicVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  return { micVolume, startAudioAnalysis, stopAudioAnalysis };
}
