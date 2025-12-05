# Face Detection Models

This directory contains the pre-trained models for face-api.js:

- `tiny_face_detector_model-*`: Lightweight face detection model
- `face_landmark_68_model-*`: 68-point facial landmark detection
- `face_expression_model-*`: Emotion recognition model

## Detected Emotions

The face expression model can detect 7 emotions:
- Neutral
- Happy
- Sad
- Angry
- Fearful
- Disgusted
- Surprised

## Eye Contact Detection

Eye contact is calculated using facial landmarks and classified as:
- **Good**: Direct gaze, centered alignment
- **Poor**: Slightly off-center or looking away
- **None**: Face not detected

## Usage

These models are automatically loaded by the `useFaceDetection` hook when the camera is activated.

**Do not delete or modify these files.**

## Re-download

If models are corrupted or missing, run:
```bash
npm run download-models
```

Or manually:
```bash
./scripts/download-models.sh
```
