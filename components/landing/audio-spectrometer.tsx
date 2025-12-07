"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type AudioSpectrometerProps = {
  className?: string;
};

type BarConfig = {
  min: number;
  max: number;
  duration: number;
  delay: number;
  lightness: number;
};

export function AudioSpectrometer({ className = "" }: AudioSpectrometerProps) {
  const bars = useMemo<BarConfig[]>(
    () =>
      Array.from({ length: 56 }).map((_, i) => ({
        min: 8 + Math.random() * 14,
        max: 55 + Math.random() * 40,
        duration: 0.9 + Math.random() * 0.9,
        delay: i * 0.02,
        lightness: 55 + Math.random() * 30,
      })),
    []
  );

  return (
    <div
      className={`relative h-[400px] border border-zinc-800 bg-zinc-900/30 overflow-hidden flex flex-col justify-end px-4 pb-10 ${className}`}
    >
      {/* Atmospherics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_45%)]" />
      <motion.div
        className="absolute inset-y-0 w-24 bg-white/6 blur-3xl"
        animate={{ x: ["-10%", "120%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Header */}
      <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500 tracking-widest">
        FREQ_ANALYSIS // HZ
      </div>

      {/* Bars */}
      <div className="relative flex w-full h-full items-end gap-[3px]">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              background: `linear-gradient(180deg, hsla(0, 0%, ${bar.lightness + 15}%, 0.95), hsla(0, 0%, ${bar.lightness - 10}%, 0.35))`,
              boxShadow: `0 0 14px hsla(0, 0%, ${bar.lightness}%, 0.18)`,
            }}
            animate={{
              height: [
                `${bar.min}%`,
                `${bar.max}%`,
                `${bar.min + (bar.max - bar.min) * 0.35}%`,
              ],
              opacity: [0.35, 1, 0.55],
              filter: ["blur(0px)", "blur(0.6px)", "blur(0px)"],
            }}
            transition={{
              duration: bar.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: bar.delay,
            }}
          />
        ))}

        {/* Baseline pulse */}
        <motion.div
          className="absolute left-0 right-0 bottom-0 h-[2px] bg-white/30"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
