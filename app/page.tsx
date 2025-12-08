/* eslint-disable prettier/prettier */
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Eye, Mic, Activity, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { InteractiveGrid } from "@/components/landing/interactive-grid";
import { FaceAnim } from "@/components/landing/face-anim";
import { AudioSpectrometer } from "@/components/landing/audio-spectrometer";

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

      <InteractiveGrid />

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          style={{ opacity, scale }}
          className="relative w-full max-w-6xl mx-auto px-6 flex flex-col items-center text-center gap-10"
        >
          {/* Frame accents */}
          <div className="pointer-events-none absolute inset-x-8 top-12 border-t border-white/5" />
          <div className="pointer-events-none absolute inset-x-8 bottom-14 border-t border-white/5" />

          <div className="flex items-center justify-center gap-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
            <span className="font-mono text-xs tracking-[0.3em] text-red-400 uppercase">
              System Active
            </span>
          </div>

          <div className="relative space-y-3">
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/5 to-transparent blur-3xl opacity-40" />
            <p className="relative font-mono text-sm tracking-[0.2em] text-zinc-500 uppercase">
              Investor Reality Check
            </p>
            <h1 className="relative text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-[-0.035em] text-transparent bg-clip-text bg-linear-to-b from-white via-zinc-200 to-zinc-500">
              Pitch like your <br className="hidden md:block" />
              life depends on it
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 font-mono text-[11px] md:text-xs tracking-[0.3em] text-zinc-400 uppercase">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Scanning Micro-Expressions · Ready
            </span>
            <span className="hidden md:inline text-zinc-700">/</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Audio Spectrum Analysis · Ready
            </span>
            <span className="hidden md:inline text-zinc-700">/</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Live Sentiment Tracking · Ready
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="flex justify-center"
          >
            <Link href="/pitch">
              <button className="group relative px-8 py-3 bg-white text-black font-mono text-sm tracking-[0.2em] uppercase overflow-hidden border border-white/10 hover:border-white/30 transition duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/16 transition" />
                <div className="absolute inset-[-120%] bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_55%)] animate-[spin_9s_linear_infinite]" />
                <span className="relative flex items-center gap-2">
                  Initialize Session
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </Link>
          </motion.div>
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
          <div className="h-[400px] w-full border border-zinc-800 bg-zinc-900/20 relative overflow-hidden group md:ml-20">
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
          <AudioSpectrometer className="md:order-1" />
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
              &quot;You lost me at slide 3. Your enthusiasm is there, but your
              data is weak.&quot;
            </p>
            <p className="text-zinc-400">
              Instant, AI-generated feedback that tells you exactly what an
              investor is thinking but won&apos;t say to your face.
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
