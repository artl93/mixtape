#!/bin/bash
# run-local-ci.sh - Run the full CI workflow locally for Mixtape backend
set -e

# Clean up any old backend server logs that could interfere with mktemp or server startup
rm -f /tmp/mixtape-backend-server.*.log

# 1. Set environment variables (edit as needed)
export POSTGRES_USER=${POSTGRES_USER:-groove_admin}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-SunsetMelody2025}
export POSTGRES_DB=${POSTGRES_DB:-bandmix_prod}
export POSTGRES_CONNECTION_STRING="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"

# 2. Start PostgreSQL (if not running, use Homebrew)
if ! pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
  echo "[run-local-ci.sh] Starting PostgreSQL using Homebrew..."
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql
    sleep 5
  else
    echo "[run-local-ci.sh] Homebrew not found. Please start Postgres manually."
    exit 1
  fi
else
  echo "[run-local-ci.sh] PostgreSQL is already running."
fi

# 3. Install dependencies
./build.sh

# 3.5. Run Prettier --write for backend and frontend
npx prettier --write "src/backend/**/*.ts" "src/backend/**/*.js"
cd src/web
npx prettier --write 'src/**/*.{ts,tsx,css,md}'
cd ../..

# 4. Set up the database
./eng/mixtape-db-setup.sh

# 5. Lint, format, and type-check backend (run from root)
echo "[run-local-ci.sh] Running lint..."
if ! npm run lint; then
  echo "[run-local-ci.sh] ERROR: Linting failed. See output above."
  exit 1
fi
echo "[run-local-ci.sh] Lint passed."

echo "[run-local-ci.sh] Running Prettier (format check only)..."
if ! npx prettier --check src/**/*.ts; then
  echo "[run-local-ci.sh] ERROR: Prettier formatting errors detected. Run 'npx prettier --write src/**/*.ts' to fix."
  exit 1
fi
echo "[run-local-ci.sh] Prettier formatting passed."

npm run format
cd src/backend
npx tsc --noEmit
cd ../..

# 6. Run end-to-end tests
./run-test-server.sh
sleep 5
./test-server.sh

# 7. Run web frontend Playwright tests
cd src/web
npm install --legacy-peer-deps
npx playwright install --with-deps

# --- Start frontend server in background ---
FRONTEND_LOG="/tmp/mixtape-frontend-server.$$.log"
FRONTEND_PID=""
function stop_frontend {
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "[run-local-ci.sh] Stopping frontend server (PID $FRONTEND_PID)..."
    kill "$FRONTEND_PID"
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap stop_frontend EXIT

# Start frontend (React dev server)
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "[run-local-ci.sh] Started frontend server (PID $FRONTEND_PID), waiting for it to be ready..."

# Wait for frontend to be ready (max 30s)
for i in {1..30}; do
  if curl -sSf http://localhost:3000 >/dev/null; then
    echo "[run-local-ci.sh] Frontend is up!"
    break
  fi
  sleep 1
done
if ! curl -sSf http://localhost:3000 >/dev/null; then
  echo "[run-local-ci.sh] ERROR: Frontend did not start in time. Log output:" >&2
  cat "$FRONTEND_LOG" >&2
  exit 1
fi

npx playwright test

cd ../..

# 8. Stop backend server
./eng/stop-test-server.sh

# 9. Stop Postgres (if started by this script, Homebrew)
if command -v brew >/dev/null 2>&1; then
  echo "[run-local-ci.sh] Stopping PostgreSQL service (Homebrew)..."
  brew services stop postgresql
fi

trap - EXIT
# Kill all frontend servers on port 3000 (not just the one started by this script)
FRONTEND_PIDS=$(lsof -ti :3000)
if [ -n "$FRONTEND_PIDS" ]; then
  echo "[run-local-ci.sh] Cleaning up all frontend servers on port 3000: $FRONTEND_PIDS ..."
  kill $FRONTEND_PIDS || true
fi

echo "[run-local-ci.sh] Local CI workflow complete!"
