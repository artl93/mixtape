#!/bin/bash
# mixtape-server-start.sh
# Ensures Postgres, backend, and frontend servers are running. Starts any that are not running.
set -e

# 1. Start Postgres if not running
if ! pg_isready -U "${POSTGRES_USER:-groove_admin}" -d "${POSTGRES_DB:-bandmix_prod}" >/dev/null 2>&1; then
  echo "[mixtape-server-start.sh] Starting PostgreSQL using Docker..."
  docker run --rm -d --name mixtape-postgres -e POSTGRES_USER="${POSTGRES_USER:-groove_admin}" -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-SunsetMelody2025}" -e POSTGRES_DB="${POSTGRES_DB:-bandmix_prod}" -p 5432:5432 postgres:15
  export PG_DOCKER_STARTED=1
  sleep 5
else
  echo "[mixtape-server-start.sh] PostgreSQL is already running."
fi

# 2. Start backend if not running
if ! lsof -i :4000 | grep LISTEN >/dev/null 2>&1; then
  echo "[mixtape-server-start.sh] Starting backend server..."
  ./run-test-server.sh
  sleep 5
else
  echo "[mixtape-server-start.sh] Backend server is already running on port 4000."
fi

# 3. Start frontend (React dev server) if not running
if ! lsof -i :3000 | grep LISTEN >/dev/null 2>&1; then
  echo "[mixtape-server-start.sh] Starting frontend (React dev server)..."
  cd src/web
  npm install --legacy-peer-deps
  npm start &
  FRONTEND_PID=$!
  sleep 8
  cd ../..
else
  echo "[mixtape-server-start.sh] Frontend is already running on port 3000."
fi

echo "[mixtape-server-start.sh] All services are running."
