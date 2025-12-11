#!/bin/bash
# run-backend.sh - Starts the backend server on port 4000
set -e

# Load environment variables from .env if present
if [ -f src/backend/.env ]; then
  echo "[INFO] Loading environment variables from src/backend/.env file"
  export $(grep -v '^#' src/backend/.env | xargs)
fi

PORT="${PORT:-4000}"
NODE_ENV="${NODE_ENV:-development}"

log() {
  echo "[run-backend.sh] $1"
}

log "Starting backend server on port $PORT (NODE_ENV=$NODE_ENV)..."
cd src/backend
PORT="$PORT" NODE_ENV="$NODE_ENV" npm run dev &
log "Backend server started in background (PID: $!)"
