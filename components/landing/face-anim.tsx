"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function FaceAnim() {
  const [mouthShape, setMouthShape] = useState(0); // 0: Closed, 1: O, 2: Wide, 3: Narrow
  const [blink, setBlink] = useState(false);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [eyebrowState, setEyebrowState] = useState(0);

  // Blink interval
  useEffect(() => {
    const blinkTrigger = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      const nextBlink = Math.random() * 1000 + 2000;
      setTimeout(blinkTrigger, nextBlink);
    };
    const timeout = setTimeout(blinkTrigger, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Eye movement
  useEffect(() => {
    const moveEyes = () => {
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 3;
      setPupilPos({ x, y });

      if (Math.random() > 0.7) {
        setEyebrowState(1);
        setTimeout(() => setEyebrowState(0), 1000);
      }

      setTimeout(moveEyes, 2500);
    };
    moveEyes();
  }, []);

  // Speaking interval - Randomize phonemes
  useEffect(() => {
    const speakInterval = setInterval(() => {
      // 30% chance to be closed (pause), otherwise random shape
      const nextShape =
        Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 3) + 1;
      setMouthShape(nextShape);
    }, 150);
    return () => clearInterval(speakInterval);
  }, []);

  const colors = {
    skin: "#A1A1AA",
    hair: "#18181B",
    shirt: "#3F3F46",
    details: "#52525B",
    skinShadow: "#71717A",
  };

  // Mouth Paths
  const mouthPaths = [
    // 0: Closed (Neutral)
    "M 85 172 Q 100 174 115 172",
    // 1: Open "O" / "Ah"
    "M 88 168 Q 100 185 112 168 Q 100 160 88 168",
    // 2: Wide "E" / "Smile"
    "M 82 170 Q 100 182 118 170 Q 100 168 82 170",
    // 3: Narrow "U" / "W"
    "M 92 170 Q 100 178 108 170 Q 100 166 92 170",
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-zinc-900/50">
      <svg
        viewBox="0 0 200 260"
        className="w-56 h-72 drop-shadow-2xl opacity-90 grayscale contrast-125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skinGradient" x1="100" y1="50" x2="100" y2="200">
            <stop offset="0%" stopColor="#D4D4D8" />
            <stop offset="100%" stopColor="#A1A1AA" />
          </linearGradient>
          <linearGradient id="neckGradient" x1="100" y1="180" x2="100" y2="230">
            <stop offset="0%" stopColor="#A1A1AA" />
            <stop offset="100%" stopColor="#71717A" />
          </linearGradient>
        </defs>

        {/* Shoulders */}
        <path
          d="M 20 260 C 20 260, 30 220, 100 220 C 170 220, 180 260, 180 260"
          fill={colors.shirt}
        />
        <path d="M 65 260 L 100 220 L 135 260" fill="#27272A" opacity="0.3" />

        {/* Neck */}
        <path
          d="M 75 180 L 75 225 C 75 235, 125 235, 125 225 L 125 180"
          fill="url(#neckGradient)"
        />

        {/* Head Shape (drawn first to act as base) */}
        <path
          d="M 50 100 C 50 50, 150 50, 150 100 C 150 140, 140 175, 100 195 C 60 175, 50 140, 50 100"
          fill="url(#skinGradient)"
        />

        <g transform="translate(0, 40)">
          {/* Hair - Main mass (drawn over the head base) */}
          <path
            d="M 40 90 C 30 40, 60 10, 100 10 C 140 10, 170 40, 160 95 C 160 95, 155 95, 155 85 C 155 50, 135 30, 100 30 C 65 30, 50 70, 50 100"
            fill={colors.hair}
          />
          {/* Sideburns/Hair sides - These are filled areas, not just lines */}
          <path
            d="M 50 100 L 50 140 Q 55 130 55 110 L 50 95 Z"
            fill={colors.hair}
          />
          <path
            d="M 150 100 L 150 140 Q 145 130 145 110 L 150 95 Z"
            fill={colors.hair}
          />
        </g>

        {/* Ears - Placed after head and hair, connecting visually */}
        <path
          d="M 45 125 C 40 115, 40 145, 50 155"
          fill="url(#skinGradient)"
          stroke={colors.details}
          strokeWidth="0.5"
        />
        <path
          d="M 155 125 C 160 115, 160 145, 150 155"
          fill="url(#skinGradient)"
          stroke={colors.details}
          strokeWidth="0.5"
        />

        {/* Face Features Group */}

        <g transform="translate(0, 0)">
          {/* Eyebrows */}
          <motion.path
            animate={{ y: eyebrowState === 1 ? -4 : 0 }}
            d="M 60 115 Q 75 110 90 115"
            stroke={colors.details}
            strokeWidth="2.5"
            fill="none"
            opacity="0.7"
            strokeLinecap="round"
          />
          <motion.path
            animate={{ y: eyebrowState === 1 ? -4 : 0 }}
            d="M 110 115 Q 125 110 140 115"
            stroke={colors.details}
            strokeWidth="2.5"
            fill="none"
            opacity="0.7"
            strokeLinecap="round"
          />

          {/* Eyes */}
          <g>
            <path d="M 65 130 Q 75 122 85 130 Q 75 138 65 130" fill="#E4E4E7" />
            <motion.circle
              cx="75"
              cy="130"
              r={blink ? 0 : 3}
              fill="#18181B"
              animate={{ cx: 75 + pupilPos.x, cy: 130 + pupilPos.y }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            />

            <path
              d="M 115 130 Q 125 122 135 130 Q 125 138 115 130"
              fill="#E4E4E7"
            />
            <motion.circle
              cx="125"
              cy="130"
              r={blink ? 0 : 3}
              fill="#18181B"
              animate={{ cx: 125 + pupilPos.x, cy: 130 + pupilPos.y }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            />
          </g>

          {/* Nose */}
          <path
            d="M 100 125 L 96 155 L 104 155 Z"
            fill="#71717A"
            opacity="0.2"
          />
          <path
            d="M 94 152 Q 100 160 106 152"
            stroke={colors.details}
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />

          {/* Mouth - Randomized Phonemes */}
          <motion.g
            animate={{
              y: mouthShape !== 0 ? 3 : 0,
            }}
            transition={{ duration: 0.1 }}
          >
            <motion.path
              animate={{ d: mouthPaths[mouthShape] }}
              fill={mouthShape !== 0 ? "#3F3F46" : "none"}
              stroke={colors.skinShadow}
              strokeWidth={mouthShape !== 0 ? "0" : "1.5"}
              strokeLinecap="round"
              transition={{ duration: 0.15, ease: "easeInOut" }}
            />
          </motion.g>
        </g>
      </svg>

      {/* Tracking Box */}
      <div className="absolute inset-6 border border-white/10 rounded-lg pointer-events-none">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/30" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/30" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/30" />
      </div>
    </div>
  );
}
