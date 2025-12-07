"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Eye, Mic, Activity, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ScannerOverlay } from "@/components/landing/scanner-overlay";
import { InteractiveGrid } from "@/components/landing/interactive-grid";
import { FaceAnim } from "@/components/landing/face-anim";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <main className="min-h-screen w-full bg-[#050505] text-white selection:bg-red-500/30 selection:text-red-200">
      {/* Vague Checkered Background */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <ScannerOverlay />
      <InteractiveGrid />

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          style={{ opacity, scale }}
          className="text-center space-y-2 relative"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono text-xs tracking-[0.2em] text-red-500 uppercase">
              System Active
            </span>
          </div>

          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-transparent mix-blend-overlay">
            DO THEY <br />
            BELIEVE YOU?
          </h1>

          <div className="flex flex-col items-center gap-1 font-mono text-zinc-500 mt-8 text-xs tracking-widest uppercase">
            <p>Scanning Micro-Expressions... [READY]</p>
            <p>Audio Spectrum Analysis... [READY]</p>
            <p>Live Sentiment Tracking... [READY]</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-24 left-0 right-0 flex justify-center"
        >
          <Link href="/pitch">
            <button className="group relative px-8 py-4 bg-transparent border border-white/20 hover:bg-white/5 transition-all duration-300">
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-white transition-all group-hover:w-full group-hover:h-full group-hover:border-white/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-white transition-all group-hover:w-full group-hover:h-full group-hover:border-white/50" />

              <span className="relative font-mono text-lg tracking-widest flex items-center gap-4">
                INITIALIZE_SESSION
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Analysis Modules */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32 space-y-32">
        {/* Module 01: Vision */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-zinc-500 font-mono text-sm border-b border-zinc-800 pb-2">
              <Eye className="w-4 h-4" />
              <span>MODULE_01 :: VISION_TRACKING</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight">
              We see what <br />
              <span className="text-zinc-500">you&apos;re hiding.</span>
            </h2>
            <p className="text-lg text-zinc-400 font-mono leading-relaxed">
              {">"} EYE_CONTACT_LOST: 14% <br />
              {">"} FEAR_DETECTED: 0.3s <br />
              {">"} SMILE_AUTHENTICITY: 82%
            </p>
            <p className="text-zinc-400">
              Our computer vision system tracks 68 facial landmarks at 30fps. We
              know when you&apos;re nervous before you do.
            </p>
          </div>
          <div className="h-[400px] border border-zinc-800 bg-zinc-900/20 relative overflow-hidden group ml-20">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            {/* Faux Vision UI */}
            <div className="absolute top-4 left-4 text-xs font-mono text-red-500">
              REC ●
            </div>
            <div className="absolute top-4 right-4 text-xs font-mono text-zinc-500">
              ISO 800
            </div>

            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[calc(100%-8rem)] flex items-center justify-center">
              <FaceAnim />
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-xs text-zinc-500">
              <span>FACE_ID: CONFIRMED</span>
              <span>CONFIDENCE: 99.8%</span>
            </div>
          </div>
        </section>

        {/* Module 02: Audio */}
        <section className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="md:order-2 space-y-6">
            <div className="flex items-center gap-4 text-zinc-500 font-mono text-sm border-b border-zinc-800 pb-2">
              <Mic className="w-4 h-4" />
              <span>MODULE_02 :: AUDIO_SPECTROMETRY</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight">
              Silence is <br />
              <span className="text-zinc-500">loud.</span>
            </h2>
            <p className="text-lg text-zinc-400 font-mono leading-relaxed">
              {">"} FILLER_WORDS: 12 (&quot;UM&quot;, &quot;LIKE&quot;) <br />
              {">"} WPM: 145 (OPTIMAL) <br />
              {">"} VOLUME_VARIANCE: LOW
            </p>
            <p className="text-zinc-400">
              Deepgram Nova-2 transcription combined with raw audio signal
              analysis. We catch every stumble, stutter, and hesitation.
            </p>
          </div>
          <div className="h-[400px] border border-zinc-800 bg-zinc-900/20 relative overflow-hidden flex items-end justify-between px-4 pb-12 gap-[2px] md:order-1">
            {/* Faux Spectrogram */}
            <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500">
              FREQ_ANALYSIS // HZ
            </div>
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="w-full bg-zinc-500/50"
                animate={{
                  height: [
                    `${Math.random() * 20 + 10}%`,
                    `${Math.random() * 80 + 10}%`,
                    `${Math.random() * 40 + 10}%`,
                  ],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: Math.random() * 1 + 0.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: i * 0.02,
                }}
              />
            ))}
          </div>
        </section>

        {/* Module 03: The Roast */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-zinc-500 font-mono text-sm border-b border-zinc-800 pb-2">
              <FileText className="w-4 h-4" />
              <span>MODULE_03 :: EXECUTIVE_SUMMARY</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight">
              The <br />
              <span className="text-red-500">Verdict.</span>
            </h2>
            <p className="text-lg text-zinc-400 font-mono leading-relaxed">
              "You lost me at slide 3. Your enthusiasm is there, but your data
              is weak."
            </p>
            <p className="text-zinc-400">
              Instant, AI-generated feedback that tells you exactly what an
              investor is thinking but won't say to your face.
            </p>
          </div>
          <div className="h-[400px] border border-zinc-800 bg-zinc-900/20 relative p-8 font-mono text-xs md:text-sm text-zinc-400 overflow-hidden flex flex-col justify-between">
            <div className="space-y-4 opacity-90">
              <div className="flex gap-2">
                <span className="text-zinc-600">{">"}</span>
                <span>INITIATING_FEEDBACK_SEQUENCE...</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-600">{">"}</span>
                <span>PARSING_SLIDES [####........] 32%</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-600">{">"}</span>
                <span>ANALYZING_TONE_VECTORS...</span>
              </div>
              <div className="mt-8 border-l-2 border-red-500 pl-4 text-white">
                <p className="text-xs text-red-500 mb-2">CRITICAL_INSIGHT</p>
                <p className="leading-relaxed">
                  Speaker exhibits signs of{" "}
                  <span className="text-red-400">high anxiety</span> during Q&A
                  simulation. Recommended Action: Pause for 2s before
                  responding.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-zinc-600 tracking-widest uppercase">
              Session_ID: 8F3-22A
            </div>

            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/5 to-transparent h-[10px] animate-scan pointer-events-none" />
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-black py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-zinc-500 rounded-full" />
            <span className="font-mono text-xs text-zinc-500 tracking-widest">
              SYSTEM_ID: COLUMBIA_HACKS_25
            </span>
          </div>
          <div className="text-zinc-600 text-xs font-mono tracking-widest uppercase">
            Designed for Human Optimization
          </div>
        </div>
      </footer>
    </main>
  );
}
