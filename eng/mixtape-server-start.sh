#!/bin/bash
# mixtape-server-start.sh
# Usage: ./mixtape-server-start.sh
# Loads PORT and NODE_ENV from environment or .env file and starts the backend server

set -e

# Load environment variables from .env if present
if [ -f src/backend/.env ]; then
  echo "[INFO] Loading environment variables from src/backend/.env file"
  export $(grep -v '^#' src/backend/.env | xargs)
fi

PORT="${PORT:-4000}"
NODE_ENV="${NODE_ENV:-development}"

log() {
  echo "[mixtape-server-start] $1"
}

# DEPRECATED: Use run-server.sh instead.
echo "[mixtape-server-start.sh] This script is deprecated. Use run-server.sh instead."
exit 1

log "Starting backend server on port $PORT (NODE_ENV=$NODE_ENV)..."
cd src/backend
PORT="$PORT" NODE_ENV="$NODE_ENV" npm run dev &
log "Backend server started in background (PID: $!)"
