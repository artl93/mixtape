#!/bin/bash
# status.sh - Check the status of PostgreSQL and backend server
set -e

# Check PostgreSQL status
PG_STATUS=$(brew services list | grep postgresql | awk '{print $2}')
echo "[status.sh] PostgreSQL service status: $PG_STATUS"

# Check backend server status
SERVER_PID=$(ps aux | grep 'ts-node-dev' | grep 'src/backend/src/app.ts' | grep -v grep | awk '{print $2}')
if [ -z "$SERVER_PID" ]; then
  echo "[status.sh] Backend server: Not running"
else
  echo "[status.sh] Backend server: Running (PID: $SERVER_PID)"
fi
