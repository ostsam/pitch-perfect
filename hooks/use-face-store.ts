"use client";

import { useState, useRef, useCallback } from "react";
import type { FaceData } from "@/hooks/use-face-detection";

export function useFaceStore() {
  const [currentFaceData, setCurrentFaceData] = useState<FaceData | null>(null);
  const faceDataRef = useRef<FaceData | null>(null);

  const handleFaceData = useCallback((data: FaceData | null) => {
    faceDataRef.current = data;
    setCurrentFaceData(data);
  }, []);

  return {
    currentFaceData,
    faceDataRef,
    handleFaceData,
  };
}
