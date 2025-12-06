Session 2025-12-05: initialized context tracking for orb/microphone check.
Session 2025-12-05: Wired orb to mic RMS via Web Audio analyser in `app/page.tsx`; `Orb` now accepts `volume` prop; cleanup for mic tracks/audio context added.

Session 2025-12-05: In `components/orb.tsx` removed synchronous setState in effect; now derive display volume and only simulate volume when active without external prop to satisfy lint rule.

Session 2025-12-05: Refactored `app/page.tsx` audio hooks—moved start/stop analysis callbacks before Deepgram effect, added dependencies (including stopAudioAnalysis), converted analyzePitch/triggerRoast to useCallback, removed unused pdfText state.

Session 2025-12-05: Constrained `app/page.tsx` workspace to viewport by adding overflow handling and min-h-0 on content areas; hero/workspace now scroll internally while page remains pinned to screen height.

Session 2025-12-05: Reworked workspace layout—PDF now fills main area; added show/hide camera toggle; moved orb to compact bottom-right overlay on PDF; PDF viewer zoom fixed using react-pdf scale with measured width/height.

Session 2025-12-05: Tweaked orb placement to mini dock in PDF bottom-right with status pill (“Listening”/“Idle”) and subtle shadow; kept pointer-events-none to avoid blocking PDF interaction.

Session 2025-12-05: Stacked orb + status vertically at PDF bottom-right per feedback; maintained non-interactive overlay.

Session 2025-12-05: Added placeholder `public/sw.js` to prevent repeated 404 requests; ready to expand if PWA/offline behavior is needed.

Session 2025-12-05: Reduced orb footprint to avoid shifting on activate; orb now accepts sizeClass prop, dock uses w-16 h-16 holder with w-12 h-12 orb for stable alignment.

Session 2025-12-05: Removed unused `components/roast-feed.tsx` (toast UI) per request.

Session 2025-12-05: Tightened ElevenLabs service typing—`streamAudio` now returns `ReadableStream<Uint8Array>` instead of `any`.

Session 2025-12-05: Hardened PDF service typing—replaced `any` event payloads with typed/unknown handling in `lib/services/pdf.ts`.

Session 2025-12-05: Added page-level context flow—PDF processing now returns per-page text; client tracks current page and sends page text + deck summary to analyzePitch; OpenAI prompt prioritizes page text with trimmed summary. Minor Tailwind/unused state cleanups.

Session 2025-12-05: Standardized on Bun—set `packageManager` to `bun@1.2.15` and removed npm/pnpm/yarn lockfiles.

Session 2025-12-05: Code review for commit d4ef026—flagged PDF viewer not resetting pageNumber on new document load and Deepgram session reconnects on each roast due to useEffect/analyzePitch deps; no code changes made.

Session 2025-12-05: Fixed PDF viewer reset/clamp by resetting to page 1 on load and clamping pageNumber in render; prevented Deepgram session churn by moving roast history to a ref so the websocket/media recorder are stable across roasts.

Session 2025-12-05: Added guards to avoid queuing multiple roasts—introduce isAnalyzing/isSpeaking refs to block overlapping pitch analyses and speech playback in `app/page.tsx`.

Session 2025-12-05: Added streaming TTS playback with MediaSource and brief buffer; `/api/speak` already streams MP3, client now consumes stream to reduce roast latency while keeping prompt page context intact.

Session 2025-12-05: Updated OpenAI system prompt to wrap roast text with tone markers `[angry>` prefix and `<screaming]` suffix for aggressive delivery.

Session 2025-12-05: Tightened roast timing—MediaRecorder sends ~100ms chunks; analyzePitch now gated by new transcript delta + min interval, with single-flight TTS pending flag, incremental transcript consumption, and 7s post-roast cooldown to prevent stacked/late playback.

Session 2025-12-05: Further latency tuning—MediaSource preplay buffer trimmed to ~250ms, analyzePitch interval floor lowered to 1.5s with a 2s check loop, and roast cooldown tightened to ~5s to react faster while keeping single-flight safety.

Session 2025-12-05: Latency pass 2—roast cooldown reduced to ~3s; added 3s fail-safe timeout to clear pending/speaking if playback never starts; ensured timeout clears on end/pause/error for faster recovery.

Session 2025-12-05: Prevented user speech from stopping roasts—on unexpected audio pause, we now attempt to resume playback instead of clearing speaking flags; flags still clear on natural end/error/timeouts.

Session 2025-12-05: Reduced premature roasts—track last transcript time; require ~2.5s silence and minimum 40-char delta before analysis to avoid firing during ongoing speech fragments.

Session 2025-12-05: Simplified realtime pipeline—removed analysis interval; debounce (~500ms) on new final transcripts triggers analysis with minimal (24 char) delta requirement and 1.5s min interval; single-flight TTS preserved.

Session 2025-12-05: Utterance buffering—collect partial/final transcripts with a 1.3s utterance timer; analyze after debounce or when buffer grows, enabling mid-sentence interrupts; cleans partial cache/buffer on roast.

Session 2025-12-05: UI tweak—camera panel now opens by default on medium and larger screens via matchMedia check.

Session 2025-12-05: Tooling—added Prettier (format script) and aligned ESLint config indentation for consistency.
Session 2025-12-06: Added feedback persistence layer (`lib/feedback-store.ts`) with localStorage-backed store and section/overall derivation helpers.
Session 2025-12-06: Hooked roast lifecycle to append per-page feedback (page text, transcript, roast) in `use-roast-session`.
Session 2025-12-06: Introduced `useFeedback` hook and `FinalFeedback` component to display sectional and overall summaries with drilldown and clear controls; rendered below workspace when a deck is loaded.
Session 2025-12-06: Added `/feedback` page showing `FinalFeedback` with simulated session data; `FinalFeedback` now accepts optional session overrides and custom text for demo usage.
Session 2025-12-06: Polished FinalFeedback UI (accent badges, stat cards, improved section layout, accent palette) and refreshed `/feedback` page background/hero copy for a more designed feel.
