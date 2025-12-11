#!/bin/bash
# This script deletes all tracks and uploaded files from the Mixtape backend via the API.
# Usage: ./cleanup-all-data.sh [API_BASE_URL]

API_BASE="${1:-${MIXTAPE_API_BASE:-${REACT_APP_API_BASE:-http://localhost:4000}}}"

# 1. Get all track IDs and titles
TRACKS_JSON=$(curl -s "$API_BASE/api/tracks")

# Parse track IDs and titles into arrays
mapfile -t TRACK_IDS < <(echo "$TRACKS_JSON" | jq -r '(.tracks // .) | .[].id')
mapfile -t TRACK_TITLES < <(echo "$TRACKS_JSON" | jq -r '(.tracks // .) | .[].title')

if [ ${#TRACK_IDS[@]} -eq 0 ]; then
  echo "No tracks to delete."
  exit 0
fi

echo "Found ${#TRACK_IDS[@]} tracks. Deleting..."

for i in "${!TRACK_IDS[@]}"; do
  id="${TRACK_IDS[$i]}"
  title="${TRACK_TITLES[$i]}"
  curl -s -X DELETE "$API_BASE/api/tracks/$id" && echo "Deleted track: $title (id=$id)"
done

echo "All tracks deleted. Uploaded files should be removed by backend."
