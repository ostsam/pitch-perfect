# Hathora Integration Guide

## ✅ Complete Integration

Pitch Perfect now uses **Hathora's full voice AI pipeline**:

- **STT**: Parakeet (Speech-to-Text via WebSocket)
- **TTS**: Kokoro (Text-to-Speech synthesis)
- **LLM**: Qwen-3-Omni-30B (AI roast generation)

## Quick Start

### 1. Get Your Hathora API Key

Visit [Hathora Console](https://console.hathora.dev) and get your API key.

### 2. Configure the App

**Option A: Environment Variable**
```bash
# Create .env.local
echo "NEXT_PUBLIC_HATHORA_API_KEY=your-api-key-here" > .env.local
```

**Option B: UI Configuration**
1. Click the ⚙️ Settings icon in the navbar
2. Enter your Hathora API key
3. Click "Save Configuration"
4. App will reload with AI enabled

### 3. Start Using

```bash
pnpm dev
```

Then:
1. Upload a PDF presentation
2. Click **"Start Session"**
3. Start pitching!
4. AI will interrupt with roasts when you mess up

## How It Works

### Pipeline Architecture

```
Microphone → Parakeet STT → Real-time Transcript
                                    ↓
                          Interrupt Detector
                    (analyzes speech + emotions + slides)
                                    ↓
                          Interrupt Triggered?
                                    ↓
                         [Instant Audio Filler]
                                    +
                         [Qwen-3 LLM Generation]
                                    ↓
                         [Kokoro TTS Synthesis]
                                    ↓
                         AI Roast Playback
```

### Audio System

1. **Instant Filler** - Pre-loaded `sandeeeepp.mp3` plays immediately (0ms latency)
2. **AI Generation** - LLM streams roast text in background
3. **TTS Synthesis** - Kokoro converts text to speech
4. **Queue Playback** - Audio plays sequentially (filler → roast)

### Interrupt Triggers

The system detects:

| Trigger | Example | AI Roast |
|---------|---------|----------|
| **Buzzwords** | "um", "uh", "like", "basically" | "Stop saying 'um' - you sound unprepared!" |
| **Speed** | Talking too fast (>180 WPM) | "Slow down! This isn't an auction." |
| **Speed** | Talking too slow (<100 WPM) | "Pick up the pace, we're falling asleep here." |
| **Emotion** | Looking fearful/sad/angry | "You look terrified. Should we call this off?" |
| **Contradiction** | Statement conflicts with slide | "Wait... that's not what your slide says!" |

## Service Details

### Parakeet STT Service

**Endpoint**: `wss://app-1c7bebb9-6977-4101-9619-833b251b86d1.app.hathora.dev/ws`

- Real-time speech recognition
- WebSocket streaming
- 16kHz audio input
- Partial and final transcripts

**Implementation**: `hooks/use-microphone.ts`
```typescript
const stt = new ParakeetSTTService({ apiKey });
await stt.connect((transcript) => {
  console.log('Transcript:', transcript);
});
stt.sendAudio(audioBuffer);
```

### Kokoro TTS Service

**Endpoint**: `https://app-01312daf-6e53-4b9d-a4ad-13039f35adc4.app.hathora.dev/synthesize`

- High-quality voice synthesis
- Fast generation (~500ms)
- Streaming support
- Multiple voices available

**Implementation**: `lib/hathora-services.ts`
```typescript
const tts = new KokoroTTSService({ apiKey });
const audioBuffer = await tts.synthesize("Your roast text here");
```

### Hathora LLM Service

**Endpoint**: `https://app-362f7ca1-6975-4e18-a605-ab202bf2c315.app.hathora.dev/v1`

- OpenAI-compatible API
- Qwen-3-Omni-30B model
- Streaming support
- Context-aware roasts

**Implementation**: `lib/hathora-services.ts`
```typescript
const llm = new HathoraLLMService({ apiKey });
const roast = await llm.generateRoast({
  transcript: "um, so like...",
  emotion: "fearful",
  slideNumber: 3,
  triggerType: "buzzword"
});
```

## Testing

### Local Mode (No API Key)

Works without Hathora API key:
- ✅ Face detection and emotions
- ✅ Camera feed
- ✅ PDF viewing with slide tracking
- ✅ Interrupt detection logic
- ✅ Local audio playback
- ❌ Real STT (simulated transcripts)
- ❌ AI-generated roasts
- ❌ TTS synthesis

### Full Mode (With API Key)

All features enabled:
- ✅ Real-time speech recognition
- ✅ AI-generated contextual roasts
- ✅ Natural voice synthesis
- ✅ Complete interrupt pipeline

## Console Debugging

Watch for these events:

```
🎙️ Microphone started with Hathora STT
✅ Parakeet STT connected
🎤 Transcript: "um, so our product is like..."
⚡ Interrupt triggered: { type: 'buzzword', value: 'um' }
🔊 Playing interrupt for: buzzword
💬 Generated roast: "Stop saying 'um' - you sound unprepared!"
```

## File Structure

```
/lib
  ├── hathora-services.ts       # STT, TTS, LLM clients
  ├── interrupt-detector.ts     # Trigger analysis
  └── hathora-client.ts         # [DEPRECATED - old WebSocket]

/hooks
  ├── use-microphone.ts         # Audio capture + Parakeet STT
  ├── use-pitch-session.ts      # Orchestration + interrupts
  └── use-face-detection.ts     # Emotion tracking

/components
  ├── config-modal.tsx          # API key configuration
  └── ...

/public/audio
  └── sandeeeepp.mp3           # Instant interrupt filler
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_HATHORA_API_KEY=your-api-key-here
```

**Note**: `NEXT_PUBLIC_` prefix required for browser access.

## Error Handling

### No API Key
```
⚠️ Running in local mode. Add HATHORA_API_KEY for AI roasts.
🎙️ Microphone started (local mode - no STT)
```

### Connection Failed
```
❌ STT WebSocket error: [error details]
Failed to access microphone. Please check permissions.
```

### Audio Playback Issues
```
🔊 Audio playback error: [error details]
```

Check:
1. Browser autoplay policy (click page first)
2. Audio file exists at `/public/audio/sandeeeepp.mp3`
3. HTTPS enabled (required for microphone)

## Production Deployment

### Vercel

1. Add environment variable in Vercel dashboard:
   ```
   NEXT_PUBLIC_HATHORA_API_KEY = your-key
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Other Platforms

Ensure:
- HTTPS enabled (required for microphone/camera)
- Environment variable set
- `/public/audio/` files included in build

## Next Steps

### Add More Interrupt Audio

Create variations in `/public/audio/`:
```
interrupts/
  ├── um.mp3              # Filler words
  ├── fast.mp3            # Rushed speech  
  ├── slow.mp3            # Dragging on
  ├── confused.mp3        # Contradictions
  └── nervous.mp3         # Negative emotions
```

Update `hooks/use-pitch-session.ts` to map triggers to specific files.

### Extract PDF Text

For contradiction detection:

```bash
pnpm add pdf-parse
```

Extract text from uploaded PDF and pass to `startSession(deckText)`.

### Custom Voices

Kokoro TTS supports multiple voices:

```typescript
await tts.synthesize(text, "aggressive"); // Harsh roast voice
await tts.synthesize(text, "sympathetic"); // Gentle feedback
```

## Architecture Comparison

### Old (Custom WebSocket)
```
Custom WS Client → Qwen Omni → Manual audio handling
```

### New (Hathora Pipeline)  
```
Parakeet STT → Qwen-3 LLM → Kokoro TTS
(Specialized services, better quality)
```

## Credits

Built with:
- **Hathora**: Voice AI infrastructure
- **Parakeet**: NVIDIA STT model
- **Kokoro**: Text-to-speech synthesis
- **Qwen-3-Omni-30B**: Alibaba's multimodal LLM
- face-api.js: Emotion detection
- Next.js 16: React framework
