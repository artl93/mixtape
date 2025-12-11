#!/bin/bash
# stop-frontend.sh - Stop the React frontend dev server (port 3000)

FRONTEND_PID=$(lsof -ti :3000)
if [ -n "$FRONTEND_PID" ]; then
  echo "[stop-frontend.sh] Stopping frontend (React dev server) on port 3000: $FRONTEND_PID ..."
  kill $FRONTEND_PID || true
else
  echo "[stop-frontend.sh] No frontend server process found on port 3000."
fi
