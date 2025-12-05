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

