"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Orb } from "@/components/orb";
import { CameraFeed } from "@/components/camera-feed";
import type { FaceData } from "@/hooks/use-face-detection";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => null,
  }
);

interface WorkspaceStageProps {
  file: File;
  onPageChange: (page: number) => void;
  isRoasting: boolean;
  micVolume: number;
  showCamera: boolean;
  currentFaceData: FaceData | null;
  onFaceData: (data: FaceData | null) => void;
}

export function WorkspaceStage({
  file,
  onPageChange,
  isRoasting,
  micVolume,
  showCamera,
  currentFaceData,
  onFaceData,
}: WorkspaceStageProps) {
  return (
    <motion.div
      key="workspace"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-row gap-4 p-6 min-h-0 overflow-hidden"
    >
      {/* PDF takes majority / full width */}
      <div className="relative flex-1 h-full min-h-0 rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-2xl">
        <PdfViewer file={file} onPageChange={onPageChange} />
        {/* Docked mini orb + status (stacked) */}
        <div className="pointer-events-none absolute bottom-0.5 right-12 flex flex-col items-center gap-2 w-20">
          <div className="pointer-events-none flex items-center justify-center w-16 h-16 rounded-full bg-black/50 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <Orb active={isRoasting} volume={micVolume} sizeClass="w-12 h-12" />
          </div>
          <div className="pointer-events-none px-2 py-1 rounded-full bg-black/60 border border-white/10 shadow-sm text-[10px] font-mono uppercase tracking-wide text-zinc-200 w-full text-center">
            {isRoasting ? "Listening" : "Idle"}
          </div>
        </div>
      </div>

      {/* Camera panel toggled */}
      {showCamera && (
        <div className="w-[280px] flex-none h-full min-h-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative">
            <CameraFeed active={true} onFaceData={onFaceData} />
          </div>

          {/* Face Analysis Debug */}
          <div className="h-1/3 relative rounded-2xl border border-white/5 bg-white/2 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50 pointer-events-none z-10" />
            <div className="h-full flex flex-col p-4">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3 border-b border-white/5 pb-2 flex-none">
                Face Analysis Debug
              </h3>

              {currentFaceData ? (
                <div className="flex-1 overflow-auto space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Emotion:</span>
                    <span className="text-white font-bold capitalize">
                      {currentFaceData.dominantEmotion}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Confidence:</span>
                    <span className="text-green-400">
                      {(currentFaceData.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-zinc-500 mb-2 text-[10px]">
                      All Emotions:
                    </div>
                    {Object.entries(currentFaceData.emotions)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([emotion, value]) => (
                        <div
                          key={emotion}
                          className="flex justify-between items-center mb-1"
                        >
                          <span className="text-zinc-500 capitalize text-[11px]">
                            {emotion}:
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${value * 100}%` }}
                              />
                            </div>
                            <span className="text-zinc-400 text-[10px] w-8 text-right">
                              {(value * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
                  No face detected
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
