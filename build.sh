#!/bin/bash
# build.sh - Installs dependencies and prepares the backend for development or deployment
set -e

echo "[build.sh] Installing backend dependencies..."
cd src/backend
npm install
cd ../..

echo "[build.sh] Installing root/test dependencies..."
npm install

echo "[build.sh] Build complete."
