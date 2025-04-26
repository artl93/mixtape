#!/bin/bash
# stop-postgres.sh - Stop PostgreSQL service (macOS/Homebrew)
set -e

echo "[stop-postgres.sh] Stopping PostgreSQL service..."
brew services stop postgresql
