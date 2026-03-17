#!/bin/bash
set -e

# Patch hardcoded Windows model paths in app.py to use container paths
# This only modifies the CONTAINER's copy — the local file stays untouched
sed -i 's|MODEL_PATH = r"C:\\Users\\Lenovo\\Downloads\\yt_ai_classifier_model_2.sav"|MODEL_PATH = "/app/models/yt_ai_classifier_model_2.sav"|g' /app/app.py
sed -i 's|VECTORIZER_PATH = r"C:\\Users\\Lenovo\\Downloads\\tfidf_vectorizer.sav"|VECTORIZER_PATH = "/app/models/tfidf_vectorizer.sav"|g' /app/app.py

echo "Model paths patched for container environment."

# Run the Flask app
exec python app.py
