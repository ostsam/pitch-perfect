"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Eye, EyeOff, Smile } from "lucide-react";
import { useFaceDetection, FaceData } from "@/hooks/use-face-detection";
import { cn } from "@/lib/utils";

interface CameraFeedProps {
  active: boolean;
  onFaceData?: (data: FaceData | null) => void;
}

export function CameraFeed({ active, onFaceData }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Face detection hook
  const { faceData, isModelLoaded, error } = useFaceDetection(videoRef, {
    enabled: active && hasPermission === true,
    onFaceData: (data) => {
      console.log("🎭 Face Detection Data:", data);
      onFaceData?.(data);
    },
    detectionInterval: 500, // Detect every 500ms
  });

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        console.log("🎥 Requesting camera access...");
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }, 
          audio: false 
        });
        
        console.log("✅ Camera access granted, stream:", stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("📹 Video element srcObject set");
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log("✅ Video metadata loaded");
            videoRef.current?.play().then(() => {
              console.log("▶️ Video playing");
              setHasPermission(true);
            }).catch(err => {
              console.error("❌ Error playing video:", err);
            });
          };
        }
      } catch (err) {
        console.error("❌ Error accessing camera:", err);
        setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        console.log("🛑 Stopping camera stream");
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Camera Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl ring-1 ring-white/5">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover transform scale-x-[-1]",
            hasPermission === false && "hidden"
          )}
        />
        
        {hasPermission === false && (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4 bg-zinc-900/50">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
               <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Camera Access Required</p>
          </div>
        )}
      </div>
    </div>
  );
}
