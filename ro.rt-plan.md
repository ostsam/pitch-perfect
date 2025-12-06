Goal: simplify and stabilize realtime roast feedback with minimal latency and no hangs.

Principles

- Event-driven analysis on new speech, not fixed intervals.
- Single-flight TTS with resilient resume and short buffer.
- Lightweight gating: small debounce, short cooldown, minimal state.

Proposed flow

1. Mic → Deepgram: keep 100ms MediaRecorder, append finals; track lastFinalAt timestamp and lastConsumed index.
2. Debounce: when a new final arrives, start a short debounce (e.g., 400–600ms) to accumulate a phrase; cancel/restart on more finals.
3. Analysis trigger: after debounce, analyze the new delta (since lastConsumed). If delta < N chars (e.g., 24–32) skip. No extra silence requirement.
4. Cooldown: after a roast trigger, block further analysis for 2500–3000ms.
5. TTS: keep MediaSource with 250ms buffer; keep pending flag; add 3s fail-safe to clear pending if playback not started; on pause, retry play; clear on end/error.
6. Cleanup: clear debounce on teardown.

Implementation targets

- `app/page.tsx`: remove interval; add debounce timer; track lastFinalAt; update analyzePitch signature to take a delta string; simplify guards.
- No API changes expected.
