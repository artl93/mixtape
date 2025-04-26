#!/bin/bash
# start-postgres.sh - Start PostgreSQL service (macOS/Homebrew)
set -e

echo "[start-postgres.sh] Starting PostgreSQL service..."
brew services start postgresql
