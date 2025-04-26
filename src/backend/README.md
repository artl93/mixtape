# Mixtape Backend

This is the backend service for the Mixtape project. It is built with Node.js, TypeScript, Express, and PostgreSQL. Audio files are stored locally under `_server-data/uploads/` (for dev/testing), with future support for Azure Blob Storage. All backend features are automated and ready for integration with a frontend.

## Features

- User authentication (Google Identity, coming soon)
- Audio upload, streaming, and delete (local disk, Azure Blob in future)
- PostgreSQL database (local or Azure)
- Playlists, sharing, comments (coming soon)
- Automated setup, migration, and test scripts

## Getting Started

1. Install dependencies:
   ```sh
   cd ../../ # from backend dir, or run from project root
   ./build.sh
   ```
2. Set up the database:
   ```sh
   ./eng/mixtape-db-setup.sh
   ```
3. Start the backend server (fire-and-forget):
   ```sh
   ./run-test-server.sh
   ```
4. Stop the backend server:
   ```sh
   ./eng/stop-test-server.sh
   ```
5. Run end-to-end tests:
   ```sh
   ./test-server.sh
   ```

## Project Structure

- `app.ts` - Main Express app
- `migrate.ts` - DB migration script
- `models/` - Data models (user, track, playlist, comment)
- `routes/` - API routes (audio upload/stream/delete)
- `services/` - DB/storage/auth logic
- `utils/` - Utility functions
- `init.sql` - DB schema
- `uploads/` - (legacy, not used; see `_server-data/uploads/`)

## Environment Variables

- `POSTGRES_CONNECTION_STRING` - PostgreSQL connection string
- `PORT` - Port to run the server (default: 4000)
- See project root README for more details

---

All file storage is under `_server-data/uploads/` (gitignored). See project root README for full workflow and automation details.
