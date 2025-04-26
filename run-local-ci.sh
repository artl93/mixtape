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

# 2. Start PostgreSQL (if not running)
if ! pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
  echo "[run-local-ci.sh] Starting PostgreSQL using Docker..."
  docker run --rm -d --name mixtape-postgres -e POSTGRES_USER="$POSTGRES_USER" -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" -e POSTGRES_DB="$POSTGRES_DB" -p 5432:5432 postgres:15
  export PG_DOCKER_STARTED=1
  sleep 5
else
  echo "[run-local-ci.sh] PostgreSQL is already running."
fi

# 3. Install dependencies
./build.sh

# 4. Set up the database
./eng/mixtape-db-setup.sh

# 5. Lint, format, and type-check backend
cd src/backend
npm run lint
npm run format
npx tsc --noEmit
cd ../..

# 6. Run end-to-end tests
./run-test-server.sh
sleep 5
./test-server.sh
./eng/stop-test-server.sh

# 7. Stop Docker Postgres if started by this script
if [ "$PG_DOCKER_STARTED" = "1" ]; then
  echo "[run-local-ci.sh] Stopping Docker PostgreSQL container..."
  docker stop mixtape-postgres
fi

echo "[run-local-ci.sh] Local CI workflow complete!"
