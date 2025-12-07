"use client";

import { FinalFeedback } from "@/components/final-feedback";
import { useFeedback } from "@/hooks/use-feedback";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";

export default function FeedbackPage() {
  const { session } = useFeedback();

  return (
    <main className="h-screen w-full bg-[#020202] text-white overflow-hidden flex flex-col">
      {/* Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/05 blur-[150px] animate-pulse" />
      </div>

      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-0">
        <div className="relative z-10 w-full max-w-5xl h-full max-h-[800px] flex flex-col">
          <div className="flex-none mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-light text-zinc-300">
                Session Report
              </h1>
              <p className="text-sm text-zinc-500">
                Review your performance and feedback.
              </p>
            </div>
            <Link
              href="/pitch"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Pitch
            </Link>
          </div>

          <div className="flex-1 min-h-0">
            <FinalFeedback
              title="Performance Review"
              description="Detailed breakdown of your pitch."
            />
          </div>
        </div>
      </div>
    </main>
  );
}
