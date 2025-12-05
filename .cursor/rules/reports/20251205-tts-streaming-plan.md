Original request / feature
- Reduce roast latency by streaming TTS audio (MP3), allow quick interruption, keep page context in prompt. Buffer briefly before playback.

Challenges
- Need browser-friendly streaming playback (MP3) without large refactor; avoid breaking existing Deepgram/analysis loop; ensure page context stays in prompt payload.

Plan
- Update ElevenLabs service to stream MP3 via readable stream with small chunk size.
- Change `/api/speak` to return a streaming response (MP3) rather than full blob.
- On the client (`app/page.tsx`), play streaming audio with short buffer (~0.5s) using MediaSource for stability; gate analysis while speaking, but keep prompt using current page text/summary as today.
- Verify prompt payload still includes pageText/deckSummary in `analyze-pitch` call.

