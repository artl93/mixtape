/**
 * Test timeouts in milliseconds
 */
export const TEST_TIMEOUTS = {
  element: 15000,   // Wait for element visibility
  playerBar: 10000, // Wait for player bar
  edit: 3000,       // Wait for edit button
  form: 5000        // Wait for form fields
};

/**
 * Base title from the test.mp3 file's ID3 tags
 */
export const BASE_TITLE = 'California Route (2025-04-04)';

/**
 * Test data for metadata edits
 */
export const TEST_METADATA = {
  artist: 'Test Artist',
  album: 'Test Album',
  trackNumber: '42'
} as const;
