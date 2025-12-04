"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/file-upload";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, ArrowLeft, Aperture, Activity, Camera } from "lucide-react";
import { RoastFeed } from "@/components/roast-feed";
import { Orb } from "@/components/orb";
import { CameraFeed } from "@/components/camera-feed";
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
      
      {/* Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/05 blur-[150px] animate-pulse duration-[10000ms]" />
      </div>

      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-50 flex-none px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setFile(null); setIsRoasting(false); }}>
          <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
            <Aperture className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium text-sm tracking-wide text-zinc-300">
            Pitch Perfect
          </span>
        </div>

        {file && (
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsRoasting(!isRoasting)}
               className={cn(
                 "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2",
                 isRoasting 
                  ? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]" 
                  : "bg-white text-black hover:bg-zinc-200"
               )}
             >
               {isRoasting ? "Live Session" : "Start Session"}
             </button>
           </div>
        )}
      </motion.header>

      {/* Content Stage */}
      <div className="flex-1 relative z-10 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center p-6 relative"
            >
              {/* Hero Text */}
              <div className="text-center space-y-6 max-w-4xl mb-12 relative z-20">
                 <motion.h1 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40"
                 >
                   Pitch like your life depends on it.
                 </motion.h1>
              </div>

              {/* Upload Zone */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
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
              className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0"
            >
              {/* LEFT: PDF Viewer (6 cols - 50%) */}
              <div className="col-span-6 h-full rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-2xl relative flex flex-col">
                <PdfViewer file={file} />
              </div>

              {/* CENTER: Orb (3 cols - 25%) */}
              <div className="col-span-3 h-full flex flex-col items-center justify-center relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none" />
                 <Orb active={isRoasting} />
                 <div className="absolute bottom-10 text-center space-y-2 opacity-50">
                    <p className="text-[10px] font-mono uppercase tracking-widest">AI Status</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", isRoasting ? "bg-blue-500 animate-pulse" : "bg-zinc-700")} />
                      <span className="text-xs font-medium text-zinc-400">{isRoasting ? "Listening..." : "Idle"}</span>
                    </div>
                 </div>
              </div>

              {/* RIGHT: Camera (3 cols - 25%) */}
              <div className="col-span-3 h-full flex flex-col gap-4">
                 <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative">
                    <CameraFeed active={isRoasting} />
                 </div>
                 
                 {/* Roast Feed below camera */}
                 <div className="h-1/3 relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden p-4">
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none z-10" />
                   <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4 border-b border-white/5 pb-2">Live Critique</h3>
                   <RoastFeed isActive={isRoasting} />
                 </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}