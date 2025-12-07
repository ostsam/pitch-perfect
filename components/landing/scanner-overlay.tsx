"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ScannerOverlay() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split("T")[1].slice(0, 12));
    };
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 mix-blend-difference text-white">
      {/* Data Readouts */}

      {/* Scan Line */}
      <motion.div
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-[2px] bg-white/10 blur-[1px]"
      />
    </div>
  );
}
