#!/bin/zsh
# stop-backend.sh - Stop the Mixtape backend server running on port 4000

PID=$(lsof -tiTCP:4000 -sTCP:LISTEN)
if [[ -n "$PID" ]]; then
  echo "Stopping backend server (PID $PID) on port 4000..."
  kill $PID
  sleep 1
  if kill -0 $PID 2>/dev/null; then
    echo "Process $PID did not terminate, sending SIGKILL..."
    kill -9 $PID
  fi
  echo "Backend server stopped."
else
  echo "No backend server running on port 4000."
fi
