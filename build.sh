#!/usr/bin/env bash
# Triggering new build...
# Exit on error
set -o errexit

echo "Installing Node dependencies..."
npm install

echo "Building Next.js app..."
npm run build

echo "Moving static files to backend..."
rm -rf backend/static
cp -r out backend/static

echo "Copying models to root as fallback..."
cp backend/*.sav .

echo "Environment check:"
python --version
python -m pip --version

echo "Installing Python build tools..."
python -m pip install --upgrade pip
python -m pip install setuptools wheel

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Downloading NLTK data..."
python -c "import nltk; nltk.download(['punkt', 'punkt_tab', 'averaged_perceptron_tagger', 'averaged_perceptron_tagger_eng'])"

echo "Build complete!"
