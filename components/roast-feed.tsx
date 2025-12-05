"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, XOctagon } from "lucide-react";

export interface RoastMessage {
  id: string;
  text: string;
  severity: "info" | "warning" | "critical";
  timestamp: number;
}

export function RoastFeed({ roasts }: { roasts: RoastMessage[] }) {
  return (
    <div className="absolute bottom-8 right-8 w-[400px] pointer-events-none z-100 flex flex-col items-end gap-3">
      <AnimatePresence mode="popLayout">
        {roasts.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "relative overflow-hidden w-full p-4 rounded-xl backdrop-blur-2xl border shadow-2xl",
              "flex items-start gap-4",
              msg.severity === 'critical' 
                ? "bg-red-950/30 border-red-500/30 text-red-200 shadow-red-900/10" 
                : msg.severity === 'warning'
                  ? "bg-amber-950/30 border-amber-500/30 text-amber-200 shadow-amber-900/10"
                  : "bg-zinc-900/60 border-white/10 text-zinc-200 shadow-black/20"
            )}
          >
            {/* Glowing Accent Line */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1",
              msg.severity === 'critical' ? "bg-red-500" : msg.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
            )} />

            <div className="shrink-0 mt-1 opacity-80">
               {msg.severity === 'critical' ? (
                 <XOctagon size={18} className="text-red-400" />
               ) : msg.severity === 'warning' ? (
                 <AlertTriangle size={18} className="text-amber-400" />
               ) : (
                 <Info size={18} className="text-blue-400" />
               )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  msg.severity === 'critical' ? "text-red-400" : msg.severity === 'warning' ? "text-amber-400" : "text-blue-400"
                )}>
                  {msg.severity}
                </span>
                <span className="text-[10px] font-mono text-white/20">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed font-sans text-white/90">
                &quot;{msg.text}&quot;
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}