"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FeedbackSession,
  deriveOverallSummary,
  deriveSectionSummaries,
  feedbackStore,
} from "@/lib/feedback-store";

export function useFeedback() {
  const [session, setSession] = useState<FeedbackSession>({ entries: [] });

  useEffect(() => {
    setSession(feedbackStore.load());
    const unsubscribe = feedbackStore.subscribe((next) => setSession(next));
    return unsubscribe;
  }, []);

  const sectionSummaries = useMemo(
    () => deriveSectionSummaries(session),
    [session],
  );

  const overall = useMemo(() => deriveOverallSummary(session), [session]);

  const clear = () => feedbackStore.clear();
  const startSession = () => feedbackStore.startSession();

  return { session, sectionSummaries, overall, clear, startSession };
}
