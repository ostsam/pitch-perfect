"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

export interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface FaceData {
  emotions: EmotionData;
  dominantEmotion: string;
  confidence: number;
  detectionTime: number;
}

export interface UseFaceDetectionOptions {
  enabled: boolean;
  onFaceData?: (data: FaceData) => void;
  detectionInterval?: number; // ms between detections
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseFaceDetectionOptions
) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load models
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = "/models"; // We'll put models in public/models
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Error loading face-api models:", err);
        setError("Failed to load face detection models");
      }
    }

    loadModels();
  }, []);

  // Main detection function
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !isModelLoaded || !options.enabled) {
      return;
    }

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const emotions = detections.expressions as EmotionData;
        
        // Find dominant emotion
        const emotionEntries = Object.entries(emotions);
        const [dominantEmotion, dominantValue] = emotionEntries.reduce((max, entry) =>
          entry[1] > max[1] ? entry : max
        );

        const data: FaceData = {
          emotions,
          dominantEmotion,
          confidence: dominantValue,
          detectionTime: Date.now(),
        };

        setFaceData(data);
        options.onFaceData?.(data);
      } else {
        // No face detected
        setFaceData(null);
      }
    } catch (err) {
      console.error("Face detection error:", err);
      setError("Detection failed");
    }
  }, [videoRef, isModelLoaded, options]);

  // Start/stop detection loop
  useEffect(() => {
    if (!options.enabled || !isModelLoaded) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    const interval = options.detectionInterval || 500; // Default 500ms
    detectionIntervalRef.current = setInterval(detectFace, interval);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [options.enabled, isModelLoaded, detectFace, options.detectionInterval]);

  return {
    faceData,
    isModelLoaded,
    error,
  };
}
