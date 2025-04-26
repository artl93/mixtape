#!/bin/bash
# mixtape-db-setup.sh
# Usage: ./mixtape-db-setup.sh
# Loads DB_USER, DB_PASSWORD, DB_NAME from environment or .env file

set -e

# Prefer environment variables (for CI or shell) if set, otherwise load from .env for local dev
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
  if [ -f src/backend/.env ]; then
    echo "[INFO] Loading environment variables from src/backend/.env file"
    export $(grep -v '^#' src/backend/.env | xargs)
  fi
fi

# Set variables from environment or defaults
DB_USER="${POSTGRES_USER:-groove_admin}"
DB_PASSWORD="${POSTGRES_PASSWORD:-SunsetMelody2025}"
DB_NAME="${POSTGRES_DB:-bandmix_prod}"
INIT_SQL_PATH="$(dirname "$0")/../src/backend/init.sql"

log() {
  echo "[mixtape-db-setup] $1"
}

# Detect if running in GitHub Actions CI
if [ "$GITHUB_ACTIONS" = "true" ]; then
  # In CI, always use 'postgres' as the admin user
  PGADMIN_USER="postgres"
else
  # Local: allow override, default to shell user
  PGADMIN_USER="${PGADMIN_USER:-$USER}"
fi

# Set PGADMIN_PASSWORD if provided (for CI or local superuser password)
# Usage: PGADMIN_USER=postgres PGADMIN_PASSWORD=yourpassword ./eng/mixtape-db-setup.sh
# In CI, PGADMIN_PASSWORD should be set to the value of POSTGRES_PASSWORD secret
export PGPASSWORD="$PGADMIN_PASSWORD"

# Wait for PostgreSQL to be ready (max 30s)
for i in {1..30}; do
  if psql -h localhost -U "$PGADMIN_USER" -d postgres -c '\q' 2>/dev/null; then
    echo "[mixtape-db-setup] PostgreSQL is up!"
    break
  fi
  echo "[mixtape-db-setup] Waiting for PostgreSQL to be ready... ($i/30)"
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "[mixtape-db-setup] ERROR: PostgreSQL did not become ready in time." >&2
    echo "[mixtape-db-setup] DEBUG: Attempting manual connection for diagnostics..." >&2
    psql -h localhost -U "$PGADMIN_USER" -d postgres -c '\l' || true
    netstat -an | grep 5432 || true
    env | grep POSTGRES || true
    exit 1
  fi
done

log "Creating user $DB_USER if not exists..."
psql -h localhost -U "$PGADMIN_USER" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  psql -h localhost -U "$PGADMIN_USER" -d postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

log "Creating database $DB_NAME if not exists..."
psql -h localhost -U "$PGADMIN_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  psql -h localhost -U "$PGADMIN_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

log "Granting privileges on $DB_NAME to $DB_USER..."
psql -h localhost -U "$PGADMIN_USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -h localhost -U "$PGADMIN_USER" -d postgres -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

log "Running schema migration from $INIT_SQL_PATH..."
psql postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME -v ON_ERROR_STOP=1 -f "$INIT_SQL_PATH"

log "Database setup complete!"
