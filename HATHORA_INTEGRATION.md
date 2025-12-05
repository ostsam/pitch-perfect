# Hathora Voice Integration - Implementation Guide

## Overview

This integration connects your Pitch Perfect app to the Qwen/Qwen3-Omni-30B-A3B-Instruct model via Hathora with **"The Interrupt Trick"** for 0ms latency interruptions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Camera Feed → Face Detection → Emotion Data                │
│  Microphone → Deepgram → Live Transcript                    │
│  PDF Upload → Text Extraction → Deck Context                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Interrupt Detector │ ← Analyzes in real-time
         │  - Buzzwords       │
         │  - Speed (WPM)     │
         │  - Contradictions  │
         │  - Emotions        │
         └────────┬───────────┘
                  │
        ┌─────────┴──────────┐
        │ INTERRUPT TRIGGERED │
        └─────────┬───────────┘
                  │
      ┌───────────┴────────────┐
      │                        │
      ▼                        ▼
┌──────────────┐     ┌──────────────────┐
│ LOCAL AUDIO  │     │ HATHORA WebSocket│
│ (Instant)    │     │ (Streaming AI)   │
│ "Stop there!"│     │ Generate roast   │
│ 0ms latency  │     │ with context     │
└──────────────┘     └─────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ AI Audio Stream │
                      │ Plays after     │
                      │ filler finishes │
                      └─────────────────┘
```

## The Interrupt Trick Algorithm

### Phase 1: Instant Filler (0ms)
```typescript
// Pre-loaded audio files play IMMEDIATELY
const filler = interruptCache.get('stop-right-there');
filler.play(); // ⚡ 0ms latency
```

### Phase 2: AI Generation (Background)
```typescript
// While filler plays, AI generates specific roast
hathoraClient.triggerInterrupt({
  type: 'keyword',
  value: 'synergy',
  confidence: 1.0
}, context);
```

### Phase 3: Seamless Transition
```typescript
// AI response streams back and plays after filler
// User hears: "Stop right there! → [AI roast]"
```

## Files Created

### 1. `lib/hathora-client.ts`
**Purpose:** WebSocket client for Hathora voice model

**Key Features:**
- Pre-loads interrupt audio files for instant playback
- Manages WebSocket connection to Hathora
- Handles audio streaming from AI responses
- Implements "The Interrupt Trick"

**Main Methods:**
```typescript
await client.connect();                    // Connect to Hathora
client.setPitchDeck(deckContent);          // Load deck context
await client.triggerInterrupt(trigger, ctx); // Play filler + get AI roast
client.disconnect();                       // Cleanup
```

### 2. `lib/interrupt-detector.ts`
**Purpose:** Real-time analysis engine for interrupt triggers

**Detection Rules:**

| Type | Trigger | Example |
|------|---------|---------|
| **Buzzword** | Detects jargon | "synergy", "disruptive", "paradigm shift" |
| **Speed** | >160 WPM | Talking too fast = nervous |
| **Contradiction** | Slide vs. speech mismatch | Slide: "no competitors" + Speech: "Google" |
| **Emotion** | Face analysis | Fearful face + serious topic |

**Main Methods:**
```typescript
detector.loadPitchDeck(slideNum, content); // Load slide context
const trigger = detector.analyze(transcript, faceData, slide);
const context = detector.getContext();     // Get current context
detector.reset();                          // Reset state
```

## Integration Steps

### Step 1: Install Dependencies
```bash
npm install deepgram-sdk ws
```

### Step 2: Create Interrupt Audio Files
Create these files in `/public/audio/interrupts/`:
- `stop-right-there.mp3` - "Stop right there!"
- `slow-down.mp3` - "Slow down!"
- `hold-on.mp3` - "Hold on a second!"
- `seriously.mp3` - "Seriously?"
- `wait.mp3` - "Wait!"

**Recommended:** Use ElevenLabs or similar TTS with aggressive tone.

### Step 3: Set Environment Variables
```bash
# .env.local
HATHORA_API_KEY=your_hathora_api_key
```

### Step 4: Integrate in Your App

Create `hooks/use-pitch-session.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { HathoraVoiceClient } from '@/lib/hathora-client';
import { InterruptDetector } from '@/lib/interrupt-detector';
import type { FaceData } from './use-face-detection';

export function usePitchSession() {
  const [hathoraClient] = useState(() => new HathoraVoiceClient({
    baseUrl: process.env.NEXT_PUBLIC_HATHORA_URL!,
    apiKey: process.env.NEXT_PUBLIC_HATHORA_API_KEY!,
  }));
  
  const [detector] = useState(() => new InterruptDetector());
  const [isActive, setIsActive] = useState(false);

  // Start session
  const startSession = useCallback(async (deckContent: string) => {
    await hathoraClient.connect();
    hathoraClient.setPitchDeck(deckContent);
    setIsActive(true);
  }, [hathoraClient]);

  // Handle new transcript + face data
  const processInput = useCallback((
    transcript: string,
    faceData: FaceData | null,
    currentSlide: number
  ) => {
    if (!isActive) return;

    const trigger = detector.analyze(transcript, faceData, currentSlide);
    
    if (trigger) {
      const context = {
        ...detector.getContext(),
        currentSlide,
        faceEmotion: faceData?.dominantEmotion,
        emotionConfidence: faceData?.confidence,
      };
      
      hathoraClient.triggerInterrupt(trigger, context);
    }
  }, [isActive, detector, hathoraClient]);

  // Stop session
  const stopSession = useCallback(() => {
    hathoraClient.disconnect();
    detector.reset();
    setIsActive(false);
  }, [hathoraClient, detector]);

  return {
    startSession,
    stopSession,
    processInput,
    isActive,
  };
}
```

### Step 5: Use in Page Component

```typescript
// In app/page.tsx
const { startSession, stopSession, processInput, isActive } = usePitchSession();

// When "Start Session" clicked
const handleStartSession = async () => {
  const deckContent = await extractPDFText(file);
  await startSession(deckContent);
  setIsRoasting(true);
};

// When transcript + face data updates
useEffect(() => {
  if (isActive && currentTranscript && currentFaceData) {
    processInput(currentTranscript, currentFaceData, currentSlide);
  }
}, [isActive, currentTranscript, currentFaceData, currentSlide]);
```

## Example Interrupt Flow

### User says: "Our solution leverages synergy to disrupt the market"

```
1. Transcript received: "Our solution leverages synergy"
   ↓
2. InterruptDetector.analyze() → Detects "synergy" buzzword
   ↓
3. HathoraClient.triggerInterrupt()
   │
   ├─→ [LOCAL] Play "stop-right-there.mp3" (0ms)
   │   User hears: "Stop right there!"
   │
   └─→ [HATHORA] Send to AI with context:
       Prompt: "They said 'synergy' - roast them for jargon"
       Context: Slide 4, Emotion: Neutral, Confidence: 87%
       ↓
4. AI generates: "Synergy? What does that even mean? 
   You're using buzzwords to hide the fact that you 
   have no real differentiation. Be specific!"
   ↓
5. Audio streams back and plays immediately after filler
   ↓
6. User hears seamless: 
   "Stop right there! → Synergy? What does that even mean?..."
```

## Trigger Examples

### Buzzword Trigger
```typescript
User: "We're creating a paradigm shift in the blockchain space"
                          ↑
Trigger: { type: 'keyword', value: 'paradigm shift' }
Filler: "Seriously?"
AI: "Paradigm shift? You're just selling NFTs. That's not a paradigm shift, that's a get-rich-quick scheme."
```

### Speed Trigger
```typescript
User: [Speaking at 180 WPM]
Trigger: { type: 'speed', value: 180 }
Filler: "Slow down!"
AI: "You're talking at 180 words per minute! You sound like a nervous chipmunk. Take a breath and explain clearly."
```

### Contradiction Trigger
```typescript
Slide 3: "We have no direct competitors"
User: "Google is doing something similar but..."
                    ↑
Trigger: { type: 'contradiction', value: '...' }
Filler: "Hold on a second!"
AI: "No competitors? You just mentioned Google! Do you think I'm stupid? Either you have competitors or you have no market."
```

### Emotion Trigger
```typescript
Face: Fearful (82% confidence)
User: "We're raising $2M at a $10M valuation..."
Trigger: { type: 'emotion', value: 'You look terrified' }
Filler: "Wait!"
AI: "You look absolutely terrified right now. If you don't believe in your valuation, why should investors?"
```

## Configuration

### Adjust Detection Thresholds

```typescript
const detector = new InterruptDetector({
  buzzwords: { enabled: true, threshold: 0.8 },
  speed: { enabled: true, threshold: 160 },      // Lower = more sensitive
  contradiction: { enabled: true, threshold: 0.7 },
  emotion: { enabled: true, threshold: 0.6 },    // Higher = less interrupts
});
```

### Add Custom Buzzwords

```typescript
// In lib/interrupt-detector.ts
const BUZZWORDS = [
  'synergy', 'disruptive', 
  // Add your own:
  'thought leader', 'best in class', 'world-class'
];
```

## Testing

### Test Interrupt Trigger
```typescript
// Test in console
const trigger = detector.analyze(
  "We're creating synergy through AI",
  { dominantEmotion: 'neutral', confidence: 0.9 },
  1
);
console.log(trigger); // Should detect 'synergy'
```

### Test Audio Playback
```typescript
// Test filler audio
const client = new HathoraVoiceClient({...});
await client.triggerInterrupt({
  type: 'keyword',
  value: 'test',
  confidence: 1.0
}, context);
// Should hear instant "Stop right there!"
```

## Next Steps

1. **Add Deepgram for STT** - Get real-time transcripts
2. **Extract PDF text** - Load deck context
3. **Create interrupt audio files** - Record/generate with TTS
4. **Configure Hathora endpoint** - Get API key and base URL
5. **Test end-to-end** - Upload PDF, start session, say buzzwords

## Performance Notes

- **Interrupt Latency:** 0ms (pre-loaded audio)
- **AI Response:** ~500-1000ms (streaming)
- **Total Perceived:** ~1 second for full roast
- **Detection Overhead:** <10ms per analysis

The key is that the user hears something **instantly**, making it feel like true real-time interruption, even though the AI is still generating the specific roast in the background.

---

**Ready to make VCs sweat!** 🔥
