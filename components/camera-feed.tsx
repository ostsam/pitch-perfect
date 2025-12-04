"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";

export function CameraFeed({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Camera Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl ring-1 ring-white/5">
        {hasPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4 bg-zinc-900/50">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
               <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Camera Access Required</p>
          </div>
        )}

        {/* Overlay UI */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${active ? "bg-red-500 animate-pulse" : "bg-zinc-500"}`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/80">
              {active ? "REC" : "STANDBY"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
