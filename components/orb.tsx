"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OrbProps {
  active: boolean;
}

export function Orb({ active }: OrbProps) {
  const [volume, setVolume] = useState(0);

  // Simulate volume fluctuation when active
  useEffect(() => {
    if (!active) {
      setVolume(0);
      return;
    }

    const interval = setInterval(() => {
      // Random fluctuating volume between 0.2 and 1.0
      setVolume(0.2 + Math.random() * 0.8);
    }, 100);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Core */}
      <motion.div
        animate={{
          scale: active ? 1 + volume * 0.4 : 1,
          opacity: active ? 0.8 + volume * 0.2 : 0.5,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "w-24 h-24 rounded-full blur-md transition-colors duration-500",
          active ? "bg-blue-500 shadow-[0_0_100px_rgba(59,130,246,0.6)]" : "bg-zinc-800 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        )}
      />

      {/* Outer Ring 1 */}
      <motion.div
        animate={{
          scale: active ? 1.2 + volume * 0.6 : 1.1,
          opacity: active ? 0.4 : 0.1,
          borderWidth: active ? 2 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className={cn(
          "absolute w-24 h-24 rounded-full border transition-colors duration-500",
          active ? "border-blue-400" : "border-zinc-700"
        )}
      />

      {/* Outer Ring 2 */}
      <motion.div
        animate={{
          scale: active ? 1.5 + volume * 1.2 : 1.2,
          opacity: active ? 0.2 : 0.05,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
        className={cn(
          "absolute w-24 h-24 rounded-full border border-dashed transition-colors duration-500",
          active ? "border-indigo-400" : "border-zinc-800"
        )}
      />

      {/* Particles/Sparkles (Simulated) */}
      {active && (
         <div className="absolute inset-0 w-full h-full pointer-events-none">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="w-full h-full"
           >
             <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full blur-[1px]" />
             <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full blur-[1px]" />
             <div className="absolute top-1/2 left-0 w-1 h-1 bg-white rounded-full blur-[1px]" />
           </motion.div>
         </div>
      )}
    </div>
  );
}
