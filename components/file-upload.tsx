"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Upload, File as FileIcon, Loader2, Sparkles } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
    setIsHovering(false);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          onFileSelect(acceptedFiles[0]);
        }, 1500); // Longer, more dramatic pause
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-xl mx-auto"
    >
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...getRootProps()}
        className={cn(
          "relative h-80 w-full rounded-2xl border border-white/10 bg-black overflow-hidden cursor-pointer",
          "group transition-all duration-500 ease-out",
          isDragActive
            ? "scale-[1.02] border-blue-500/50"
            : "hover:border-white/20",
        )}
      >
        <input {...getInputProps()} />

        {/* Spotlight Effect */}
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 40%)`,
          }}
        />

        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                  <Loader2 className="w-10 h-10 text-white animate-spin relative z-10" />
                </div>
                <p className="text-sm font-mono text-blue-200/70 tracking-widest uppercase">
                  Analyzing Deck Structure...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-6"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isDragActive
                      ? "bg-blue-500/20 text-blue-400 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
                      : "bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white shadow-2xl",
                  )}
                >
                  {isDragActive ? (
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-medium text-white tracking-tight">
                    {isDragActive ? "Drop to Initialize" : "Upload Pitch Deck"}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Drag and drop your PDF here, or click to browse.
                    <br />
                    <span className="text-xs opacity-50">
                      We accept standard PDF formats up to 50MB.
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
