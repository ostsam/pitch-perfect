#!/bin/bash

# Download face-api.js models
# These models are required for facial expression and landmark detection

MODELS_DIR="public/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

echo "📦 Downloading face-api.js models..."
echo "Target directory: $MODELS_DIR"

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# Download Tiny Face Detector model (lightweight, fast)
echo "⬇️  Downloading Tiny Face Detector..."
curl -L "$BASE_URL/tiny_face_detector_model-weights_manifest.json" -o "$MODELS_DIR/tiny_face_detector_model-weights_manifest.json"
curl -L "$BASE_URL/tiny_face_detector_model-shard1" -o "$MODELS_DIR/tiny_face_detector_model-shard1"

# Download Face Landmark 68 model
echo "⬇️  Downloading Face Landmark 68 Net..."
curl -L "$BASE_URL/face_landmark_68_model-weights_manifest.json" -o "$MODELS_DIR/face_landmark_68_model-weights_manifest.json"
curl -L "$BASE_URL/face_landmark_68_model-shard1" -o "$MODELS_DIR/face_landmark_68_model-shard1"

# Download Face Expression Recognition model
echo "⬇️  Downloading Face Expression Net..."
curl -L "$BASE_URL/face_expression_model-weights_manifest.json" -o "$MODELS_DIR/face_expression_model-weights_manifest.json"
curl -L "$BASE_URL/face_expression_model-shard1" -o "$MODELS_DIR/face_expression_model-shard1"

echo "✅ All models downloaded successfully!"
echo ""
echo "Models are now available in: $MODELS_DIR"
echo "The application will load them from /models at runtime."
