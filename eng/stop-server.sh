#!/bin/bash
# stop-server.sh - Stop the backend server started with run-server.sh
set -e

# Find the PID of the process listening on port 4000
PID=$(lsof -ti :4000)

if [ -z "$PID" ]; then
  echo "[stop-server.sh] No backend server process found on port 4000."
else
  echo "[stop-server.sh] Stopping backend server (PID: $PID)..."
  kill $PID
fi
