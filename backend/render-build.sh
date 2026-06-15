#!/bin/bash
set -e  # Exit on any error

echo "Starting Render build process..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build TypeScript (directly call tsc to avoid circular reference)
echo "Building TypeScript..."
npx tsc

# Install Python dependencies (no virtual environment on Render)
echo "Installing Python dependencies..."
cd python
echo "Installing Python requirements globally..."
pip install -r requirements.txt

echo "Build completed successfully!" 