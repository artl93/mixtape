# Mixtape Web Frontend

This is a React + Material UI frontend for the Mixtape backend.

## Features
- Lists all tracks from the backend (`/api/tracks`)
- Shows title, artist, and album
- Play (stream) and download each track

## Getting Started

1. Install dependencies:
   ```sh
   cd src/web
   npm install
   ```
2. Start the frontend (dev mode):
   ```sh
   npm start
   ```
3. The app will run on http://localhost:3000 and connect to the backend at http://localhost:4000

## Project Structure
- `src/App.tsx` - Main app UI
- `src/main.tsx` - Entry point
- `public/index.html` - HTML template

## Notes
- Make sure the backend is running on port 4000.
- No authentication is required for this MVP.

## Running Frontend Playwright Tests

To run the automated browser tests for the frontend (using Playwright):

1. Make sure the backend and frontend servers are running, or use the automation scripts (like `run-full-stack.sh` or `run-local-ci.sh`) to start everything for you.
2. From the `src/web` directory, install Playwright browsers (only needed once):
   ```sh
   npx playwright install --with-deps
   ```
3. Run all Playwright tests:
   ```sh
   npx playwright test
   ```
   This will run all tests in the `src/web/tests/` directory.

To run a specific test file:
```sh
npx playwright test tests/web-smoke.spec.ts
```

Test results and artifacts will be output to the `test-results/` directory.

## API Base URL Configuration

The frontend no longer hardcodes the backend API URL. Instead, it determines the API base URL in this order:

1. If the server injects a global variable (in `public/index.html` or via HTTP):
   ```html
   <script>window.__MIXTAPE_API_BASE__ = "https://your-backend.example.com";</script>
   ```
2. If the environment variable `REACT_APP_API_BASE` is set at build time:
   ```sh
   REACT_APP_API_BASE=https://your-backend.example.com npm start
   ```
3. Defaults to `http://localhost:4000` if neither is set.

This allows you to deploy the frontend anywhere and point it to any backend without code changes.

## File Uploads
- Audio uploads are performed via the web UI using the configured API base URL.
- No backend URL is embedded in the HTML or JavaScript bundle.

---
