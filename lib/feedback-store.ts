export interface FeedbackEntryInput {
  pageNumber: number;
  roast: string;
  transcript: string;
  pageText?: string;
  deckSummary?: string;
  sectionTitle?: string;
}

export interface FeedbackEntry extends FeedbackEntryInput {
  id: string;
  sectionTitle: string;
  createdAt: number;
}

export interface FeedbackSession {
  entries: FeedbackEntry[];
  startTime?: number;
}

export interface SectionSummary {
  sectionTitle: string;
  pages: number[];
  entries: FeedbackEntry[];
  latestAt: number;
}

export interface OverallSummary {
  totalEntries: number;
  uniquePages: number;
  latestAt: number | null;
}

export interface FeedbackStore {
  load(): FeedbackSession;
  startSession(): void;
  append(entry: FeedbackEntryInput): FeedbackSession;
  clear(): void;
  subscribe(listener: (session: FeedbackSession) => void): () => void;
}

const STORAGE_KEY = "feedback-log-v1";

const listeners = new Set<(session: FeedbackSession) => void>();

const notify = (session: FeedbackSession) => {
  listeners.forEach((listener) => listener(session));
};

const getId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const safeParse = (raw: string | null): FeedbackSession => {
  if (!raw) return { entries: [] };
  try {
    const parsed = JSON.parse(raw) as FeedbackSession;
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
};

const persist = (session: FeedbackSession) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore storage failures */
  }
};

export const feedbackStore: FeedbackStore = {
  load() {
    if (typeof window === "undefined") return { entries: [] };
    const cached = safeParse(window.localStorage.getItem(STORAGE_KEY));
    return cached;
  },
  startSession() {
    const session = this.load();
    // Only set start time if not already set or if we want to restart?
    // For now, let's say startSession is called when user clicks "Start Session".
    // If they pause/resume, we might not want to reset.
    // But usually "Start Session" implies a new run or resuming.
    // If `entries` are empty, definitely set start time.
    if (!session.startTime) {
      const next = { ...session, startTime: Date.now() };
      persist(next);
      notify(next);
    }
  },
  append(input) {
    const session = this.load();
    const entry: FeedbackEntry = {
      id: getId(),
      createdAt: Date.now(),
      sectionTitle: inferSectionTitle(
        input.sectionTitle,
        input.pageText,
        input.pageNumber
      ),
      ...input,
    };
    // Ensure startTime is set if not already (e.g. direct append)
    const startTime = session.startTime ?? Date.now();

    const next: FeedbackSession = {
      entries: [...session.entries, entry],
      startTime,
    };
    persist(next);
    notify(next);
    return next;
  },
  clear() {
    if (typeof window === "undefined") return;
    // When clearing, we reset everything
    const empty = { entries: [], startTime: undefined };
    persist(empty);
    notify(empty);
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function inferSectionTitle(
  provided: string | undefined,
  pageText: string | undefined,
  pageNumber: number
): string {
  if (provided?.trim()) return provided.trim();
  if (pageText) {
    const firstLine =
      pageText
        .split(/\r?\n/)
        .find((line) => line.trim().length > 0)
        ?.trim() || "";
    if (firstLine) {
      return firstLine.slice(0, 80);
    }
  }
  return `Page ${pageNumber}`;
}

export function deriveSectionSummaries(
  session: FeedbackSession,
  sectionsMap?: Array<{ title: string; startPage: number; endPage: number }>
): SectionSummary[] {
  // If we have a sections map, pre-fill the map with these sections
  // to ensure they appear even if empty, or just use them for grouping.
  // Here, we'll just use them for grouping the entries.

  const map = new Map<string, SectionSummary>();

  // Initialize sections from map if provided
  if (sectionsMap) {
    sectionsMap.forEach((section) => {
      map.set(section.title, {
        sectionTitle: section.title,
        pages: Array.from(
          { length: section.endPage - section.startPage + 1 },
          (_, i) => section.startPage + i
        ),
        entries: [],
        latestAt: 0,
      });
    });
  }

  session.entries.forEach((entry) => {
    // Determine the section title for this entry
    let sectionTitle = entry.sectionTitle;

    // If we have a map, look up which section this page belongs to
    if (sectionsMap) {
      const match = sectionsMap.find(
        (s) => entry.pageNumber >= s.startPage && entry.pageNumber <= s.endPage
      );
      if (match) {
        sectionTitle = match.title;
      }
    }

    const existing = map.get(sectionTitle);

    // If it's a new section not in the map (or map wasn't provided)
    if (!existing) {
      map.set(sectionTitle, {
        sectionTitle,
        pages: [entry.pageNumber],
        entries: [entry],
        latestAt: entry.createdAt,
      });
    } else {
      // Add page if not present
      if (!existing.pages.includes(entry.pageNumber)) {
        existing.pages.push(entry.pageNumber);
        existing.pages.sort((a, b) => a - b);
      }
      existing.entries.push(entry);
      existing.latestAt = Math.max(existing.latestAt, entry.createdAt);
    }
  });

  // Filter out sections with no entries if we pre-filled them?
  // Or keep them? Let's keep them only if they have entries for now to avoid clutter,
  // OR keep them to show coverage gaps. User asked for "breakdown", implies structure.
  // But the UI might look empty. Let's stick to sections that have entries OR were mapped.
  // Actually, let's filter out empty sections for now unless we want to show "No feedback for this section".
  // The current UI hides empty sections naturally because it maps `sectionSummaries`.
  // If I pre-fill `map`, I will have empty entries.
  // Let's return all sections from the map, plus any ad-hoc ones.

  return Array.from(map.values())
    .filter((s) => s.entries.length > 0) // Only show sections with feedback for now
    .sort((a, b) => {
      const aFirstPage = Math.min(...a.pages);
      const bFirstPage = Math.min(...b.pages);
      if (aFirstPage !== bFirstPage) return aFirstPage - bFirstPage;
      return a.latestAt - b.latestAt;
    });
}

export function deriveOverallSummary(session: FeedbackSession): OverallSummary {
  const uniquePages = new Set(session.entries.map((e) => e.pageNumber)).size;
  const latestAt =
    session.entries.length > 0
      ? Math.max(...session.entries.map((e) => e.createdAt))
      : null;
  return {
    totalEntries: session.entries.length,
    uniquePages,
    latestAt,
  };
}
