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
