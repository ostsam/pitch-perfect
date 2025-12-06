# Pitch Perfect - Face Detection Integration

## 🎯 Overview

Facial expression recognition and eye contact tracking have been integrated to provide real-time feedback during pitch sessions. This data will be sent to the AI model to generate contextual roasts and coaching.

## 🧠 What's Implemented

### 1. **Emotion Detection**

Detects 7 emotions in real-time:

- Neutral
- Happy
- Sad
- Angry
- Fearful
- Disgusted
- Surprised

### 2. **Eye Contact Tracking**

Calculates gaze direction using 68 facial landmarks:

- **Good**: Presenter maintains direct eye contact
- **Poor**: Presenter is looking slightly away
- **None**: No face detected

### 3. **Visual Feedback**

- Real-time emotion overlay on camera feed
- Eye contact quality indicator with color coding:
  - 🟢 Green: Good eye contact
  - 🟡 Yellow: Poor eye contact
  - 🔴 Red: No eye contact

## 📁 File Structure

```
├── hooks/
│   └── use-face-detection.ts      # Core face detection logic
├── components/
│   └── camera-feed.tsx            # Updated with face overlays
├── app/
│   └── page.tsx                   # Main app with face data state
├── public/
│   └── models/                    # face-api.js pre-trained models
└── scripts/
    └── download-models.sh         # Model download script
```

## 🔧 How It Works

### Face Detection Hook (`use-face-detection.ts`)

```typescript
const { faceData, isModelLoaded, error } = useFaceDetection(videoRef, {
  enabled: active,
  onFaceData: (data) => {
    // Handle face data updates
  },
  detectionInterval: 500, // Detection frequency in ms
});
```

### Face Data Structure

```typescript
interface FaceData {
  emotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  dominantEmotion: string; // Highest confidence emotion
  eyeContact: "good" | "poor" | "none";
  confidence: number; // 0-1, confidence of dominant emotion
  detectionTime: number; // Timestamp
}
```

## 🚀 Usage in AI Context

### Current Implementation

Face data is collected and logged in `app/page.tsx`:

```typescript
const handleFaceData = (data: FaceData | null) => {
  setCurrentFaceData(data);

  // TODO: Send to AI backend
  if (data && isRoasting) {
    console.log("Face Analysis:", {
      emotion: data.dominantEmotion,
      confidence: data.confidence,
      eyeContact: data.eyeContact,
    });
  }
};
```

### Future Integration (For AI Backend)

When you connect to the AI model, send this data structure:

```json
{
  "timestamp": 1701728400000,
  "faceAnalysis": {
    "emotion": "nervous",
    "confidence": 0.87,
    "eyeContact": "poor"
  },
  "transcript": "So our revenue model is...",
  "slideContext": "Slide 4: Business Model"
}
```

### Example AI Prompts with Face Data

The AI can use this for contextual roasting:

**Scenario 1: Poor Eye Contact + Nervous**

> "Stop staring at your shoes! You're pitching to investors, not your feet. Make eye contact!"

**Scenario 2: Angry Emotion During Q&A**

> "Getting defensive? That's a red flag. VCs will eat you alive if you can't handle criticism."

**Scenario 3: Overly Happy on Serious Slide**

> "Why are you smiling during the risk analysis? This isn't a comedy show."

## 🎨 Visual Indicators

### Emotion Display (Top-left of camera)

- Shows dominant emotion
- Confidence percentage
- Updates every 500ms

### Eye Contact Display (Below emotion)

- Color-coded background:
  - Green: Good eye contact
  - Yellow: Poor eye contact
  - Red: No eye contact
- Icon changes based on status

## 🔄 Data Flow

```
Camera Feed
    ↓
face-api.js Models
    ↓
useFaceDetection Hook (500ms intervals)
    ↓
FaceData Object
    ↓
Parent Component (page.tsx)
    ↓
[FUTURE] → WebSocket/API → AI Backend
```

## 📊 Performance Considerations

- **Detection Interval**: 500ms (configurable)
- **Model Loading**: ~2-3 seconds on first load
- **Processing**: Runs client-side, no backend needed for detection
- **Lightweight**: Uses TinyFaceDetector for speed

## 🐛 Troubleshooting

### Models not loading?

```bash
npm run download-models
```

### Camera permission denied?

Check browser settings and ensure HTTPS (or localhost)

### High CPU usage?

Increase `detectionInterval` in `camera-feed.tsx`:

```typescript
detectionInterval: 1000, // Run every 1 second instead of 500ms
```

### No face detected?

- Ensure good lighting
- Face should be clearly visible
- Try adjusting camera angle

## 🎯 Next Steps

1. **Connect to AI Backend**
   - Send `faceData` to your AI model endpoint
   - Include in system prompt context

2. **Enhanced Eye Contact Detection**
   - Current implementation is simplified
   - Consider using dedicated gaze estimation models

3. **Emotion History Tracking**
   - Track emotion changes over time
   - Detect patterns (e.g., nervousness spike)

4. **Calibration**
   - Allow users to calibrate their "neutral" state
   - Personalize eye contact detection

## 📚 Resources

- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Facial Landmark Detection Paper](https://arxiv.org/abs/1710.00977)

---

**Ready to integrate with your AI model!** 🚀

The face detection system is now fully functional and collecting real-time emotion and eye contact data. Your backend team can consume this data to generate intelligent, context-aware feedback.
