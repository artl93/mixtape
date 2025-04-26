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
