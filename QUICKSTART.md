# 🎭 Face Detection Integration - Quick Start

## ✅ What's Been Implemented

### 1. **Real-Time Emotion Recognition**

- Detects 7 emotions: neutral, happy, sad, angry, fearful, disgusted, surprised
- Shows dominant emotion with confidence percentage
- Updates every 500ms during active session

### 2. **Eye Contact Tracking**

- Analyzes facial landmarks to estimate gaze direction
- Three states: Good (green), Poor (yellow), None (red)
- Visual indicator on camera feed

### 3. **Data Export for AI**

- All face data is collected in `currentFaceData` state
- Ready to be sent to your AI backend
- Includes: emotion, confidence, eye contact status, timestamp

## 🚀 Testing Instructions

### Step 1: Open the App

Visit: **http://localhost:3000**

### Step 2: Upload a PDF

- Drag and drop any PDF pitch deck
- Or click to browse

### Step 3: Start Session

- Click "Start Session" button in top-right
- Allow camera permissions when prompted

### Step 4: Watch the Magic ✨

You should see:

- **Camera feed** with your face (mirrored)
- **Emotion display** (top-left) showing your current emotion
- **Eye Contact indicator** (below emotion) showing gaze quality
- **Recording indicator** (bottom) showing "REC" status

### Step 5: Test Different Expressions

Try making different faces to see emotion detection:

- 😊 Smile → Should show "happy"
- 😠 Angry face → Should show "angry"
- 😮 Surprised face → Should show "surprised"
- Look away from camera → Eye contact should change to "poor"

### Step 6: Check Console

Open browser console (F12) to see logged face data:

```javascript
{
  emotion: "neutral",
  confidence: 0.87,
  eyeContact: "good"
}
```

## 📊 Data Structure for AI Integration

The face data is available in this format:

```typescript
interface FaceData {
  emotions: {
    neutral: number; // 0-1 confidence scores
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  dominantEmotion: string; // e.g., "nervous", "happy"
  eyeContact: "good" | "poor" | "none";
  confidence: number; // 0-1
  detectionTime: number; // Unix timestamp
}
```

## 🔌 Next Steps for AI Integration

### Option A: WebSocket (Real-time)

```typescript
// In app/page.tsx
const handleFaceData = (data: FaceData | null) => {
  if (data && isRoasting && wsConnection) {
    wsConnection.send(
      JSON.stringify({
        type: "face_analysis",
        data: {
          emotion: data.dominantEmotion,
          confidence: data.confidence,
          eyeContact: data.eyeContact,
          timestamp: data.detectionTime,
        },
      }),
    );
  }
};
```

### Option B: REST API (Periodic)

```typescript
// Send face data every 5 seconds
useEffect(() => {
  if (!isRoasting || !currentFaceData) return;

  const interval = setInterval(async () => {
    await fetch("/api/analyze-pitch", {
      method: "POST",
      body: JSON.stringify({
        faceData: currentFaceData,
        slideNumber: currentSlide,
        transcript: currentTranscript,
      }),
    });
  }, 5000);

  return () => clearInterval(interval);
}, [isRoasting, currentFaceData]);
```

## 🎯 AI Prompt Examples

Your AI can use this data for contextual feedback:

**When emotion = "fearful" + eyeContact = "poor":**

> "You look terrified and you're avoiding eye contact. If you don't believe in your pitch, why should investors?"

**When emotion = "angry" during Q&A:**

> "Getting defensive? VCs will destroy you if you can't handle criticism professionally."

**When emotion = "happy" on financial slide with poor numbers:**

> "Why are you smiling? Your burn rate is unsustainable. This is serious."

## 🛠️ Troubleshooting

| Issue               | Solution                                                    |
| ------------------- | ----------------------------------------------------------- |
| Models not loading  | Run `npm run download-models`                               |
| Camera not showing  | Check browser permissions                                   |
| No emotion detected | Ensure good lighting, face clearly visible                  |
| High CPU usage      | Increase `detectionInterval` to 1000ms in `camera-feed.tsx` |

## 📁 Key Files

- `hooks/use-face-detection.ts` - Core detection logic
- `components/camera-feed.tsx` - UI with overlays
- `app/page.tsx` - Data consumption (line 27: `handleFaceData`)
- `public/models/` - Pre-trained models

## 🎨 Customization

### Change Detection Frequency

In `components/camera-feed.tsx`:

```typescript
detectionInterval: 1000, // Slower, less CPU usage
// or
detectionInterval: 200,  // Faster, more responsive
```

### Adjust Eye Contact Sensitivity

In `hooks/use-face-detection.ts`, modify `calculateEyeContact()`:

```typescript
const threshold = 30; // Increase = more lenient
```

---

## ✨ You're All Set!

Face detection is fully integrated. When your friend connects the AI model, just pass the `currentFaceData` to the backend and the AI will have full context about the presenter's emotional state and eye contact quality.

**Test it now:** Open http://localhost:3000 and try it out! 🚀
