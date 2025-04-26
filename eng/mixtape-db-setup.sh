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

log "Creating user $DB_USER if not exists..."
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  psql postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

log "Creating database $DB_NAME if not exists..."
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  psql postgres -c "CREATE DATABASE $DB_NAME;"

log "Granting privileges on $DB_NAME to $DB_USER..."
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql postgres -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

log "Running schema migration from $INIT_SQL_PATH..."
psql postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME -v ON_ERROR_STOP=1 -f "$INIT_SQL_PATH"

log "Database setup complete!"
