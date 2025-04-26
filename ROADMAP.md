# Mixtape Backend Roadmap

This document outlines the planned and proposed features, improvements, and engineering tasks for the Mixtape backend. Check off items as they are completed or reprioritize as needed.

## Core Features
- [x] Audio upload, streaming (with HTTP range/seek), and static file serving
- [x] Audio file deletion (removes file and DB record)
- [x] Store and serve files from `_server-data/uploads/`
- [x] Extract and store ID3 metadata from MP3 uploads
- [ ] User authentication (Google OAuth or email/password)
- [ ] Playlist creation and management
- [ ] Sharing tracks or playlists (public/private links)
- [ ] Comments on tracks
- [ ] Track metadata editing (title, description, etc.)
- [ ] Search and filtering for tracks/playlists

## Engineering & Automation
- [x] Automated DB setup and migration scripts
- [x] Robust local CI script (`run-local-ci.sh`) for build, lint, type-check, test, and cleanup
- [x] GitHub Actions workflow for CI/CD
- [x] Use environment variables for DB credentials (local and CI parity)
- [x] Engineering scripts for server start/stop, status, and Postgres management
- [x] Linting and formatting with ESLint (flat config) and Prettier
- [x] Resilient log file cleanup before test/CI runs
- [ ] Pre-commit hooks for lint/format/test
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Add integration/unit tests for all endpoints
- [ ] Expand test coverage for edge cases and error handling

## Cloud & Scalability
- [ ] Azure Blob Storage integration for audio files
- [ ] Azure PostgreSQL or Cosmos DB support
- [ ] Cloud deployment scripts (Azure, Docker, etc.)
- [ ] Rate limiting and abuse prevention
- [ ] Monitoring and logging improvements

## Developer Experience
- [x] Self-documenting scripts and code
- [x] Conceptual and up-to-date README files
- [ ] Example frontend integration (React/Next.js)
- [ ] Postman collection or API client samples

---

**How to use this file:**
- Update this roadmap as features are completed or priorities change.
- Use checkboxes to track progress.
- Add new ideas, bugs, or improvements as needed.
