#!/bin/bash
# run-test-server.sh - Starts the backend server for test/dev
set -e

# Load environment variables from .env if present
if [ -f src/backend/.env ]; then
  echo "[INFO] Loading environment variables from src/backend/.env file"
  export $(grep -v '^#' src/backend/.env | xargs)
fi

PORT="${PORT:-4000}"
NODE_ENV="${NODE_ENV:-development}"

log() {
  echo "[run-test-server.sh] $1"
}

log "Starting backend server on port $PORT (NODE_ENV=$NODE_ENV)..."
cd src/backend
# Write server log to a temp file instead of a git-tracked location
SERVER_LOG=$(mktemp /tmp/mixtape-backend-server.XXXXXX.log)
nohup bash -c "PORT=\"$PORT\" NODE_ENV=\"$NODE_ENV\" npm run dev" > "$SERVER_LOG" 2>&1 &
log "Backend server started in background (PID: $!)"
log "Server log: $SERVER_LOG"
