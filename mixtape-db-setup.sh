#!/bin/bash
# mixtape-db-setup.sh
# Usage: ./mixtape-db-setup.sh
# Loads DB_USER, DB_PASSWORD, DB_NAME from environment or .env file

set -e

# Load environment variables from .env if present
if [ -f .env ]; then
  echo "[INFO] Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
fi

# Set variables from environment or defaults
DB_USER="${DB_USER:-mixtape_user}"
DB_PASSWORD="${DB_PASSWORD:-yourpassword}"
DB_NAME="${DB_NAME:-mixtape}"
INIT_SQL_PATH="$(dirname "$0")/src/backend/init.sql"

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
