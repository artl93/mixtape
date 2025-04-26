#!/bin/bash
# stop-test-server.sh - Stop the backend server started with run-test-server.sh
set -e

# Find the PID(s) of any process listening on port 4000 (test server)
PIDS=$(lsof -ti :4000)

if [ -z "$PIDS" ]; then
  echo "[stop-test-server.sh] No backend server process found on port 4000."
else
  echo "[stop-test-server.sh] Stopping backend server(s) on port 4000: $PIDS ..."
  kill $PIDS
fi
