#!/bin/bash
# test-server.sh - Runs the end-to-end test for backend upload/stream
set -e

npx ts-node --project tsconfig.test.json tests/test-seed-and-stream.ts
