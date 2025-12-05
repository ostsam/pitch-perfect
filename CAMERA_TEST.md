# 🎥 Camera & Face Detection Test Guide

## ✅ Changes Made

1. **Camera is now ALWAYS visible** when you upload a PDF (not just during session)
2. **Enhanced console logging** with detailed face analysis data
3. **Live UI debug panel** showing face data in real-time below the camera

## 🧪 How to Test

### Step 1: Open the App
Visit: **http://localhost:3000**

### Step 2: Upload Any PDF
- Drag and drop a PDF file
- Or click to browse

### Step 3: See the Camera Feed
You should immediately see:
- **Camera feed** (mirrored) in the right column
- **Permission prompt** (click "Allow" if asked)
- **Live video** of yourself

### Step 4: Watch the Face Data Panel
**Below the camera**, you'll see a debug panel showing:
- ✨ **Dominant Emotion** (e.g., "neutral", "happy")
- 📊 **Confidence %** (how sure the model is)
- 👁️ **Eye Contact** (good/poor/none) with color coding
- 📉 **All Emotions** with progress bars (top 4)

This updates every **500ms** in real-time!

### Step 5: Check Browser Console
Open Developer Tools (F12 or Cmd+Option+I) and look for:

```javascript
🎭 Face Detection Data: {
  emotions: {
    neutral: 0.87,
    happy: 0.05,
    sad: 0.03,
    // ... etc
  },
  dominantEmotion: "neutral",
  eyeContact: "good",
  confidence: 0.87,
  detectionTime: 1701728400000
}

📊 Face Analysis Update: {
  timestamp: "10:23:45 AM",
  dominantEmotion: "neutral",
  confidence: "87.0%",
  eyeContact: "good",
  allEmotions: [
    { emotion: "neutral", value: "87.0%" },
    { emotion: "happy", value: "5.2%" },
    { emotion: "sad", value: "3.1%" },
    // ...
  ]
}
```

### Step 6: Test Different Expressions

Try making different faces:
- 😊 **Smile** → Should show "happy" with high confidence
- 😮 **Surprised face** → Should show "surprised"
- 😠 **Angry face** → Should show "angry"
- 😐 **Neutral** → Should show "neutral"
- **Look away** → Eye contact should change to "poor"
- **Look down/up** → Eye contact becomes "poor" or "none"

Watch both the **UI panel** and **browser console** update in real-time!

## 📊 What You'll See

### In the UI (Right Panel):
```
┌─────────────────────────┐
│   [Your Camera Feed]    │
│                         │
│  Emotion: Happy   87%   │
│  Eye Contact: Good      │
├─────────────────────────┤
│ Face Analysis Debug     │
│                         │
│ Emotion:        Happy   │
│ Confidence:       87%   │
│ Eye Contact:      Good  │
│                         │
│ All Emotions:           │
│ happy:    ████████ 87%  │
│ neutral:  ██       12%  │
│ surprised: █        1%  │
└─────────────────────────┘
```

### In Console (F12):
```
🎭 Face Detection Data: { ... full raw data ... }
📊 Face Analysis Update: { ... formatted analysis ... }
```

## 🎯 When to See Data

- ✅ **Camera visible:** As soon as you upload a PDF
- ✅ **Face detection active:** Immediately when face is visible
- ✅ **Console logging:** Every 500ms when face detected
- ✅ **UI updates:** Real-time, every 500ms

## 🐛 Troubleshooting

| Issue | What to Check |
|-------|---------------|
| No camera | Check browser permissions |
| No face data | Ensure face is clearly visible, good lighting |
| "Loading face detection..." | Models are loading (wait 2-3 seconds) |
| Console logs not appearing | Open F12, check Console tab |
| No data in UI panel | Says "No face detected" - move closer to camera |

## 🎬 What Happens During "Start Session"?

When you click **"Start Session"**:
- Camera feed gets **"REC"** indicator
- Face detection overlays appear **on the camera**
- UI panel switches from "Debug" to **"Live Critique"** (roast feed)
- Console logging **continues** in the background

## 🔥 Next Steps

The face data is now flowing! Your friend can:
1. Hook into `handleFaceData()` in `app/page.tsx`
2. Send the data to the AI backend via WebSocket or API
3. AI can use emotion + eye contact + transcript to generate roasts

---

**Ready to test!** Open http://localhost:3000, upload a PDF, and watch your emotions get tracked in real-time! 🚀
