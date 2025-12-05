## Original request / feature
- Reduce ASR/TTS timing issues causing queued or late roast playback; lower mic chunk time while preventing overlapping roasts.

## Challenges
- MediaRecorder buffers data; must lower latency without flooding analysis/TTS.
- Roasts could stack before `isSpeaking` flipped true due to streaming delay.

## Successes
- Added pending/speaking guard set at roast start, with cleanup on end/error.
- Implemented incremental transcript consumption plus min analysis interval and roast cooldown.
- Lowered mic timeslice to ~100ms for faster Deepgram delivery.

## Methods that did/didn’t work
- Did: throttle analyses on new transcript delta + interval; single-flight TTS; cooldown.
- Did not: concatenate blobs (kept native chunk streaming).

## Changes made to the codebase
- `app/page.tsx`: 100ms MediaRecorder slices, incremental transcript deltas, min analysis interval, roast cooldown, immediate TTS pending flag to block overlaps.

## Additional sessions
- Latency tuning: preplay buffer ~250ms; analysis interval floor 1.5s with 2s loop; cooldown ~3s with fail-safe timeout for stuck TTS.
- Robust playback: on unexpected pause, attempt resume so user speech doesn’t stop roasts.
- Premature roast guard: require ~2.5s silence and 40-char delta before analyzing to avoid firing mid-thought.
- Realtime simplification: removed interval loop; debounce (~500ms) on new final transcripts triggers analysis if ≥24 chars delta, keeping 1.5s min interval and single-flight TTS.

