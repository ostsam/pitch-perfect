# Pitch Perfect - Voice Integration System

## Current Status

The voice-to-voice interrupt system is now integrated! Here's what's working:

### ✅ Completed Features

1. **Face Detection** - Real-time emotion tracking with 7 emotions
2. **Camera Feed** - Live video with face analysis debug panel
3. **PDF Viewer** - Multi-page slide viewing with slide change tracking
4. **Pitch Session Hook** - Orchestrates all components (camera + mic + AI)
5. **Microphone Hook** - Audio capture ready for STT integration
6. **Interrupt Detection** - Real-time analysis of speech patterns, emotions, and content
7. **Audio Playback** - Local interrupt audio file ready (`sandeeeepp.mp3`)

### 🏗️ In Progress

1. **Deepgram STT** - Need API key and integration
2. **Hathora Voice AI** - Need API key and WebSocket URL
3. **PDF Text Extraction** - For contradiction detection
4. **Additional Interrupt Sounds** - More audio files needed

## How It Works (Local Mode)

The system currently works in **local-only mode** without needing API keys:

1. **Start Session** - Click "Start Session" button
2. **Microphone Activated** - Captures audio in 1-second chunks
3. **Face Detection Active** - Continuously tracks emotions
4. **Interrupt Detection** - Analyzes for triggers:
   - Buzzwords (um, uh, like, basically, etc.)
   - Speaking speed (too fast/slow)
   - Contradictions (requires PDF text)
   - Negative emotions (fearful, sad, angry)
5. **Local Audio Playback** - Plays `sandeeeepp.mp3` when triggered
6. **Console Logging** - Full debug output in browser console

## File Structure

```
/hooks
  ├── use-face-detection.ts    # Face emotion analysis
  ├── use-microphone.ts         # Audio capture
  └── use-pitch-session.ts      # Main orchestration

/lib
  ├── hathora-client.ts         # Voice AI client (needs API key)
  ├── interrupt-detector.ts     # Trigger analysis logic
  └── utils.ts                  # Utilities

/public/audio
  └── sandeeeepp.mp3            # Interrupt audio file

/components
  ├── camera-feed.tsx           # Webcam display
  ├── pdf-viewer.tsx            # Slide viewer
  ├── orb.tsx                   # AI status indicator
  └── ...
```

## Testing the System

### 1. Start the Dev Server

```bash
pnpm dev
```

### 2. Upload a PDF

Drag and drop any PDF presentation into the upload zone.

### 3. Start a Practice Session

Click the **"Start Session"** button. You'll see:
- 🔴 Button changes to "Stop Session"
- 🎤 Microphone starts recording
- 📹 Camera shows live video
- 📊 Face analysis updates in debug panel
- 🔵 AI status shows "Active" and "Recording"

### 4. Watch for Interrupts

Open the browser console (F12) and speak into your microphone. Look for:

```
🎤 Processing: [your transcript]
⚡ Interrupt triggered: { type: 'buzzword', value: 'um', ... }
🔊 Would interrupt with: { trigger: 'buzzword', context: {...} }
📊 Audio chunk: 12345 bytes
```

The audio file will play automatically when a trigger is detected.

### 5. Check Face Emotions

The debug panel shows:
- Dominant emotion (e.g., "neutral", "happy")
- Confidence percentage
- All 7 emotions with bar graphs

## Next Steps to Production

### 1. Add Deepgram STT

Install Deepgram SDK:
```bash
pnpm add @deepgram/sdk
```

Update `use-microphone.ts` to use Deepgram for real-time transcription.

### 2. Add Hathora Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_HATHORA_URL=wss://your-instance.hathora.cloud
NEXT_PUBLIC_HATHORA_API_KEY=your-api-key
```

Update `app/page.tsx` to pass config to `usePitchSession`:
```tsx
const { startSession, ... } = usePitchSession({
  hathoraUrl: process.env.NEXT_PUBLIC_HATHORA_URL!,
  hathoraApiKey: process.env.NEXT_PUBLIC_HATHORA_API_KEY!,
});
```

### 3. Add More Interrupt Audio

Create multiple interrupt sounds in `/public/audio/interrupts/`:
- `um.mp3` - For filler words
- `slow.mp3` - For slow speech
- `fast.mp3` - For rushed speech
- `confused.mp3` - For contradictions
- `nervous.mp3` - For negative emotions

Update `lib/hathora-client.ts` INTERRUPT_FILLERS mapping.

### 4. Extract PDF Text

Install PDF parsing library:
```bash
pnpm add pdf-parse
```

Extract text from uploaded PDF and pass to `startSession()`.

## Debugging

### Check Console Logs

All system events are logged with emoji prefixes:
- 📊 Face analysis updates
- 🎤 Microphone processing
- ⚡ Interrupt triggers
- 🔊 Audio playback
- ✅ Session events

### Common Issues

**No audio playback?**
- Check browser console for audio errors
- Ensure audio file exists at `/public/audio/sandeeeepp.mp3`
- Try clicking in the browser window first (autoplay policy)

**Microphone not working?**
- Check browser permissions
- Look for "Microphone error:" in console
- Try HTTPS (required for some browsers)

**Face detection not working?**
- Ensure models loaded (check console)
- Try better lighting
- Check camera permissions

## Architecture

```
User Speech → Microphone → [Future: Deepgram STT] → Transcript
                                                          ↓
Slide Change → PDF Viewer ────────────────────────→ Current Slide
                                                          ↓
Face Data ← Camera Feed ──────────────────────────→ Emotions
                                                          ↓
                                         Interrupt Detector
                                    (analyzes all inputs for triggers)
                                                          ↓
                                         Pitch Session Hook
                                    (orchestrates interrupts)
                                                          ↓
                               Local Audio ←────┬────→ [Future: Hathora AI]
                                (instant)       │      (streamed response)
                                                ↓
                                           User hears roast
```

## Credits

Built with:
- Next.js 16 + React 19
- face-api.js for emotion detection
- Hathora Qwen/Qwen3-Omni-30B-A3B-Instruct (voice model)
- "The Interrupt Trick" algorithm (0ms latency)
