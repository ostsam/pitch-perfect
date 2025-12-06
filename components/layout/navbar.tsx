"use client";

import { motion } from "framer-motion";
import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  file: File | null;
  isRoasting: boolean;
  onToggleRoasting: () => void;
  showCamera: boolean;
  onToggleCamera: () => void;
  onReset: () => void;
}

export function Navbar({
  file,
  isRoasting,
  onToggleRoasting,
  showCamera,
  onToggleCamera,
  onReset,
}: NavbarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-50 flex-none px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
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
            onClick={onToggleRoasting}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2",
              isRoasting
                ? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                : "bg-white text-black hover:bg-zinc-200",
            )}
          >
            {isRoasting ? "Live Session" : "Start Session"}
          </button>
          <button
            onClick={onToggleCamera}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all flex items-center gap-2 border border-white/10",
              showCamera
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-black/40 text-white hover:bg-white/10",
            )}
          >
            {showCamera ? "Hide Camera" : "Show Camera"}
          </button>
        </div>
      )}
    </motion.header>
  );
}
