"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/file-upload";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, ArrowLeft, Aperture, Activity } from "lucide-react";
import { RoastFeed } from "@/components/roast-feed";
import { cn } from "@/lib/utils";

const PdfViewer = dynamic(() => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer), {
  ssr: false,
  loading: () => null
});

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col selection:bg-white/20">
      
      {/* Ambient Background Mesh - Subtle Aurora */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/10 blur-[150px] animate-pulse duration-[10000ms]" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-900/10 blur-[150px]" />
      </div>

      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 flex-none px-8 py-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-lg blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-black border border-white/10 rounded-lg w-full h-full flex items-center justify-center">
              <Aperture className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-700" />
            </div>
          </div>
          <span className="font-medium text-sm tracking-wide text-zinc-300 group-hover:text-white transition-colors">
            Pitch Perfect <span className="opacity-30 ml-2 font-normal">AI Coach</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
             System Online
           </div>
           <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/5" />
        </div>
      </motion.header>

      {/* Content Stage */}
      <div className="flex-1 relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex flex-col items-center justify-center p-6 relative"
            >
              {/* Hero Text */}
              <div className="text-center space-y-8 max-w-4xl mb-12 relative z-20">
                 <motion.div
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.2, duration: 0.8 }}
                   className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm"
                 >
                   <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                     V2.0 Now Live
                   </span>
                 </motion.div>

                 <motion.h1 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.3, duration: 0.8 }}
                   className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40"
                 >
                   Pitch like <br/> your life depends on it.
                 </motion.h1>

                 <motion.p 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.4, duration: 0.8 }}
                   className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-light"
                 >
                   The merciless AI coach that interrupts, critiques, and refines your delivery in real-time.
                 </motion.p>
              </div>

              {/* Upload Zone */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="w-full max-w-xl relative z-20"
              >
                <FileUpload onFileSelect={setFile} />
              </motion.div>

            </motion.div>
          ) : (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Control Bar */}
              <div className="absolute top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between pointer-events-none">
                 <motion.button
                   initial={{ x: -20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   onClick={() => {
                     setFile(null);
                     setIsRoasting(false);
                   }}
                   className="pointer-events-auto flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
                 >
                   <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                   <span className="font-medium">Exit Session</span>
                 </motion.button>

                 <motion.div 
                   initial={{ y: -20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="pointer-events-auto flex items-center gap-3 p-1.5 rounded-full bg-[#0a0a0a]/90 border border-white/10 shadow-2xl backdrop-blur-xl"
                 >
                   <button className="px-4 py-2 rounded-full text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2">
                     <Mic className="w-3 h-3" />
                     Mic Check
                   </button>
                   
                   <button 
                     onClick={() => setIsRoasting(!isRoasting)}
                     className={cn(
                       "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 shadow-lg",
                       isRoasting 
                        ? "bg-red-600 text-white shadow-red-900/20 hover:bg-red-500" 
                        : "bg-white text-black shadow-white/10 hover:bg-zinc-200"
                     )}
                   >
                     {isRoasting ? (
                       <>
                         <Activity className="w-3 h-3 animate-pulse" />
                         Live
                       </>
                     ) : (
                       <>
                         <Play className="w-3 h-3 fill-current" />
                         Start
                       </>
                     )}
                   </button>
                 </motion.div>
              </div>

              {/* Main View */}
              <div className="flex-1 relative w-full h-full bg-[#050505]">
                <PdfViewer file={file} />
                <RoastFeed isActive={isRoasting} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}