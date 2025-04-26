#!/bin/bash
# run-full-stack.sh - Start Postgres, backend, and frontend, then open browser to frontend
set -e

# 1. Start Postgres if not running (Homebrew)
if ! pg_isready -U "${POSTGRES_USER:-groove_admin}" -d "${POSTGRES_DB:-bandmix_prod}" >/dev/null 2>&1; then
  echo "[run-full-stack.sh] Starting PostgreSQL using Homebrew..."
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql
    sleep 5
  else
    echo "[run-full-stack.sh] Homebrew not found. Please start Postgres manually."
    exit 1
  fi
else
  echo "[run-full-stack.sh] PostgreSQL is already running."
fi

# 2. Start backend if not running
if ! lsof -i :4000 | grep LISTEN >/dev/null 2>&1; then
  echo "[run-full-stack.sh] Starting backend server..."
  ./run-server.sh
  sleep 5
else
  echo "[run-full-stack.sh] Backend server is already running on port 4000."
fi

# 3. Start frontend (React dev server)
cd src/web
if ! lsof -i :3000 | grep LISTEN >/dev/null 2>&1; then
  echo "[run-full-stack.sh] Starting frontend (React dev server)..."
  npm install --legacy-peer-deps
  npm start &
  FRONTEND_PID=$!
  sleep 8
else
  echo "[run-full-stack.sh] Frontend is already running on port 3000."
fi
cd ../..

# 4. Open browser to frontend
if which open >/dev/null 2>&1; then
  open http://localhost:3000
elif which xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:3000
else
  echo "[run-full-stack.sh] Please open http://localhost:3000 in your browser."
fi

echo "[run-full-stack.sh] All services started. Press Ctrl+C to stop the frontend dev server manually if needed."
