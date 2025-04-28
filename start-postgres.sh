#!/bin/bash
# start-postgres.sh
# Starts the PostgreSQL server using Homebrew on macOS

set -e

if ! command -v brew &>/dev/null; then
  echo "Homebrew is not installed. Please install Homebrew first." >&2
  exit 1
fi

if ! brew services list | grep -q postgresql@14; then
  echo "PostgreSQL@14 is not installed. Installing..."
  brew install postgresql@14
fi

echo "Starting PostgreSQL@14 using Homebrew..."
brew services start postgresql@14
echo "PostgreSQL@14 started."
