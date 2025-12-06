"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

interface SessionTimerProps {
  startTime: number | null;
  className?: string;
}

export function SessionTimer({ startTime, className }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    // Update immediately
    setElapsed(Date.now() - startTime);

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 ${className}`}
    >
      <Timer className="w-3.5 h-3.5 text-zinc-500" />
      <span>
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
