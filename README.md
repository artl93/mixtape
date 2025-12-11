# Mixtape

Mixtape is a modern, scalable web application for musicians to upload, share, and stream audio files and playlists. The backend is built with Node.js, TypeScript, Express, and PostgreSQL, and is designed for easy local development and future cloud deployment.

## Philosophy
- **Developer Experience:** Automated setup, scripts, and tests for a frictionless workflow.
- **Scalability:** Clean separation of concerns, ready for frontend and cloud integration.
- **Transparency:** Source code and scripts are self-documenting—see inline comments for details.
- **Security & Policy:** See `SECURITY.md` and `CONTRIBUTING.md` for project policies.

## Features
- 🎵 Upload and stream audio files
- 🔐 Google OAuth authentication
- 🎨 Modern React frontend with Material-UI
- 📊 PostgreSQL database
- 🔒 Secure session-based authentication

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- PostgreSQL
- Google OAuth credentials (see [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md))

### Installation
1. Install dependencies: `./build.sh`
2. Start PostgreSQL: `./start-postgres.sh`
3. Set up the database: `./eng/mixtape-db-setup.sh`
4. Configure environment variables:
   - Copy `src/backend/.env.example` to `src/backend/.env`
   - Follow the [Google OAuth Setup Guide](GOOGLE_OAUTH_SETUP.md) to get your credentials
   - Update the `.env` file with your credentials
5. Start the backend: `cd src/backend && npm run dev`
6. Start the frontend: `cd src/web && npm start`

## Authentication Setup

This application uses Google OAuth for authentication. **You must configure Google OAuth credentials before the application will work.**

See the complete setup guide: [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)

⚠️ **Important Security Notes:**
- Never commit your `.env` file or secrets to version control
- Use different credentials for development and production
- Generate a strong, random `SESSION_SECRET` for production
- The application will warn you on startup if OAuth is not configured

## Continuous Integration (CI)
This project uses GitHub Actions for CI. On every push or pull request to `main`, the workflow will:
- Install dependencies
- Lint, format, and type-check the backend
- Set up a PostgreSQL service
- Run the database setup script
- Run the full end-to-end test suite

**Database credentials are managed securely using GitHub Actions secrets:**
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

See the repository settings for how to configure these secrets.

## Structure
- **Backend:** All core logic, models, and routes are in `src/backend/`.
- **Frontend:** React application in `src/web/`.
- **Tests:** End-to-end and integration tests in `tests/`.
- **Engineering scripts:** Automation and service management in `eng/`.
- **Data:** All uploads and streamed files are stored under `_server-data/` (gitignored).

## Extending
- Ready for additional authentication providers
- Cloud-ready: add Azure Blob Storage, CI/CD as needed
- Extensible architecture for playlists, comments, and sharing features

---
For details, see inline comments in each source file and script. The codebase is designed to be self-explanatory for engineers familiar with modern TypeScript/Node.js projects.
