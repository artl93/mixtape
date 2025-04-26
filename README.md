# Mixtape

Mixtape is a modern, scalable web application for musicians to upload, share, and stream audio files and playlists. The backend is built with Node.js, TypeScript, Express, and PostgreSQL, and is designed for easy local development and future cloud deployment.

## Philosophy
- **Developer Experience:** Automated setup, scripts, and tests for a frictionless workflow.
- **Scalability:** Clean separation of concerns, ready for frontend and cloud integration.
- **Transparency:** Source code and scripts are self-documenting—see inline comments for details.
- **Security & Policy:** See `SECURITY.md` and `CONTRIBUTING.md` for project policies.

## Getting Started
- Install dependencies: `./build.sh`
- Set up the database: `./eng/mixtape-db-setup.sh`
- Start/stop the backend: `./run-test-server.sh` / `./eng/stop-test-server.sh`
- Run end-to-end tests: `./test-server.sh`

## Structure
- **Backend:** All core logic, models, and routes are in `src/backend/`.
- **Tests:** End-to-end and integration tests in `tests/`.
- **Engineering scripts:** Automation and service management in `eng/`.
- **Data:** All uploads and streamed files are stored under `_server-data/` (gitignored).

## Extending
- Ready for frontend integration (React/Next.js recommended).
- Cloud-ready: add Azure Blob Storage, CI/CD, and authentication as needed.

---
For details, see inline comments in each source file and script. The codebase is designed to be self-explanatory for engineers familiar with modern TypeScript/Node.js projects.
