# Convenience Scripts

This directory contains developer convenience scripts for local development. These scripts are **not** used in CI/CD pipelines (see `/eng/` for CI/CD scripts).

## Available Scripts

### Backend Management
- **`run-backend.sh`** - Start the backend server on port 4000
- **`stop-backend.sh`** - Stop the backend server

### Frontend Management  
- **`stop-frontend.sh`** - Stop the React frontend dev server (port 3000)

### Full Stack Management
- **`run-full-stack.sh`** - Start Postgres, backend, and frontend, then open browser
- **`stop-full-stack.sh`** - Stop all services (frontend, backend, and Postgres)

### Data Management
- **`cleanup-all-data.sh`** - Delete all tracks and uploaded files via the API

## Usage

All scripts should be run from the repository root:

```bash
# Start the full stack
./scripts/run-full-stack.sh

# Stop everything
./scripts/stop-full-stack.sh

# Clean up test data
./scripts/cleanup-all-data.sh
```

## Note

For CI/CD and production-ready scripts, see the `/eng/` directory.
