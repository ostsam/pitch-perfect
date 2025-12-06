"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronDown, Download, Sparkles } from "lucide-react";
import { useFeedback } from "@/hooks/use-feedback";
import {
  FeedbackSession,
  deriveOverallSummary,
  deriveSectionSummaries,
} from "@/lib/feedback-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const formatTimestamp = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export interface FinalFeedbackProps {
  sessionOverride?: FeedbackSession;
  onClearOverride?: () => void;
  title?: string;
  description?: string;
  sections?: Array<{ title: string; startPage: number; endPage: number }>;
}

export function FinalFeedback({
  sessionOverride,
  onClearOverride,
  title = "Session Report",
  description = "Analysis of your pitch delivery.",
  sections,
}: FinalFeedbackProps) {
  const {
    session: liveSession,
    sectionSummaries: liveSectionSummaries,
    overall: liveOverall,
    clear,
  } = useFeedback();

  const session = sessionOverride ?? liveSession;
  const sectionSummaries = sessionOverride
    ? deriveSectionSummaries(session, sections)
    : deriveSectionSummaries(session, sections); // Always use sections if available
  const overall = sessionOverride ? deriveOverallSummary(session) : liveOverall;
  const clearAction = onClearOverride ?? clear;

  // Default to first section expanded only, or all if few
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sectionSummaries.map((s) => s.sectionTitle)),
  );

  const hasFeedback = session.entries.length > 0;

  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedSections(next);
  };

  if (!hasFeedback) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center backdrop-blur-sm"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col rounded-3xl border border-white/10 bg-[#050505] overflow-hidden h-full max-h-[85vh] shadow-2xl"
    >
      {/* Header */}
      <div className="flex-none relative p-6 md:p-8 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-xl z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-3">
              {title}
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400 uppercase tracking-wider transform translate-y-px">
                Live
              </span>
            </h2>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors text-xs uppercase tracking-wide"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Export
            </Button>
            <div className="h-8 w-px bg-white/10 mx-1" />
            <button
              onClick={clearAction}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
              title="Clear Feedback"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-8 grid grid-cols-3 gap-px bg-white/5 rounded-xl border border-white/5 overflow-hidden">
          <StatItem
            label="Total Roasts"
            value={overall.totalEntries.toString()}
          />
          <StatItem
            label="Pages Covered"
            value={overall.uniquePages.toString()}
          />
          <StatItem
            label="Duration"
            value={
              overall.latestAt && session.startTime
                ? Math.max(
                    1,
                    Math.ceil(
                      (overall.latestAt - session.startTime) / 1000 / 60,
                    ),
                  ) + "m"
                : "-"
            }
          />
        </div>
      </div>

      {/* Content List - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-gradient-to-b from-[#050505] to-black">
        <div className="space-y-6">
          {sectionSummaries.map((section, idx) => (
            <SectionItem
              key={section.sectionTitle}
              section={section}
              isExpanded={expandedSections.has(section.sectionTitle)}
              onToggle={() => toggleSection(section.sectionTitle)}
              index={idx}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/20 p-4 text-center transition-colors">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">
        {label}
      </div>
      <div className="text-2xl font-light text-white tracking-tight truncate px-2">
        {value}
      </div>
    </div>
  );
}

function SectionItem({
  section,
  isExpanded,
  onToggle,
  index,
}: {
  section: ReturnType<typeof deriveSectionSummaries>[0];
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 hover:opacity-80 transition-opacity select-none"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-colors">
            <span className="text-xs font-mono">{index + 1}</span>
          </div>
          <div className="text-left">
            <div className="text-lg font-light text-white">
              {section.sectionTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[10px] font-mono text-zinc-500">
            {section.entries.length} NOTE{section.entries.length !== 1 && "S"}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-600 transition-transform duration-200",
              isExpanded && "rotate-180 text-zinc-400",
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="overflow-hidden"
          >
            <div className="pl-12 pr-4 pb-8 space-y-8">
              {section.entries.map((entry, i) => (
                <div key={entry.id} className="relative group/entry">
                  {/* Vertical Thread Line */}
                  {i !== section.entries.length - 1 && (
                    <div className="absolute left-[-23px] top-3 bottom-[-32px] w-px bg-white/[0.06]" />
                  )}
                  <div className="absolute left-[-26px] top-1.5 w-[7px] h-[7px] rounded-full bg-zinc-800 border border-zinc-700 group-hover/entry:border-zinc-500 transition-colors" />

                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div className="space-y-3">
                      <p className="text-base text-zinc-300 leading-relaxed font-light">
                        {entry.roast}
                      </p>

                      {entry.pageText && (
                        <div className="pl-4 border-l-2 border-white/10 py-1 group-hover/entry:border-white/20 transition-colors">
                          <p className="text-xs text-zinc-500 font-mono leading-relaxed line-clamp-2">
                            CONTEXT: {entry.pageText}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex flex-col items-end gap-2">
                      <span className="text-[10px] font-mono text-zinc-600">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[10px] font-mono text-zinc-500">
                        PG {entry.pageNumber}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mt-2" />
    </motion.div>
  );
}
