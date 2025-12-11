#!/bin/bash

echo "Running BottomPlayerBar Component Tests"
echo "======================================="
echo

# Start the server if not already running
if ! nc -z localhost 3001 > /dev/null 2>&1; then
  echo "Starting mixtape server..."
  cd "$(dirname "$0")/.." && ./mixtape-server-start.sh &
  SERVER_PID=$!
  echo "Server started with PID: $SERVER_PID"
  sleep 3  # Give the server time to start
fi

# Start the web app if not already running
if ! nc -z localhost 3000 > /dev/null 2>&1; then
  echo "Starting web app..."
  cd "$(dirname "$0")/../src/web" && npm start &
  WEBAPP_PID=$!
  echo "Web app started with PID: $WEBAPP_PID"
  sleep 5  # Give the web app time to start
fi

echo "Opening test page in browser..."
open "http://localhost:3000/player-test.html"

echo
echo "Player Test Instructions:"
echo "========================="
echo "1. Test Play/Pause/Restart:"
echo "   - Click 'Play Track'"
echo "   - Verify audio starts playing"
echo "   - Click 'Pause Track'"
echo "   - Verify audio stops"
echo "   - Click 'Play Track' again"
echo "   - Verify audio resumes from where it was paused"
echo
echo "2. Test Slider Movement and Seeking:"
echo "   - Start playback with 'Start Playback'"
echo "   - Observe the slider moving as track plays"
echo "   - Move the slider to a different position"
echo "   - Verify audio jumps to that position"
echo
echo "3. Test Duration Display:"
echo "   - Load the track with 'Load Track'"
echo "   - Verify duration shows correct time (not 0:00)"
echo "   - Play the track and verify time counter updates"
echo
echo "When done testing, press Enter to exit..."
read

# Clean up processes if we started them
if [ -n "$SERVER_PID" ]; then
  echo "Stopping server..."
  kill $SERVER_PID
fi

if [ -n "$WEBAPP_PID" ]; then
  echo "Stopping web app..."
  kill $WEBAPP_PID
fi

echo "Test completed."
