"use client";

import { motion } from "framer-motion";
import { FileUpload } from "@/components/file-upload";

interface HeroStageProps {
  onFileSelect: (file: File) => void;
}

export function HeroStage({ onFileSelect }: HeroStageProps) {
  return (
    <motion.div
      key="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col items-center justify-center p-6 relative min-h-0 overflow-auto"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xl relative z-20"
      >
        <FileUpload onFileSelect={onFileSelect} />
      </motion.div>
    </motion.div>
  );
}
