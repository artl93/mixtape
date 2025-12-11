#!/bin/bash
# stop-full-stack.sh - Stop frontend, backend, and Postgres servers for Mixtape

# 1. Stop frontend (React dev server)
FRONTEND_PID=$(lsof -ti :3000)
if [ -n "$FRONTEND_PID" ]; then
  echo "[stop-full-stack.sh] Stopping frontend (React dev server) on port 3000: $FRONTEND_PID ..."
  kill $FRONTEND_PID || true
else
  echo "[stop-full-stack.sh] No frontend server process found on port 3000."
fi

# 2. Stop backend server
BACKEND_PID=$(lsof -ti :4000)
if [ -n "$BACKEND_PID" ]; then
  echo "[stop-full-stack.sh] Stopping backend server on port 4000: $BACKEND_PID ..."
  kill $BACKEND_PID || true
else
  echo "[stop-full-stack.sh] No backend server process found on port 4000."
fi

# 3. Stop Postgres (native/Homebrew)
if command -v brew >/dev/null 2>&1; then
  echo "[stop-full-stack.sh] Stopping Postgres with Homebrew..."
  brew services stop postgresql
else
  echo "[stop-full-stack.sh] Homebrew not found. Please stop Postgres manually if needed."
fi

echo "[stop-full-stack.sh] All services stopped."
