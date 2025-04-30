import { test, expect, Page, Locator } from '@playwright/test';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import NodeID3 from 'node-id3';

// Constants used across tests
const TEST_TIMEOUTS = {
  element: 15000,   // Wait for element visibility
  playerBar: 10000, // Wait for player bar
  edit: 3000,       // Wait for edit button
  form: 5000        // Wait for form fields
};

const BASE_TITLE = 'California Route (2025-04-04)';

/**
 * Creates a unique track title to avoid conflicts in parallel test runs
 */
function createUniqueTitle() {
  return `California Route (2025-04-04)-${Date.now()}-${Math.floor(Math.random()*10000)}`;
}

/**
 * Helper to create a temporary test file with unique ID3 tags
 * @param prefix - Prefix for the unique filename and title
 * @returns Object containing paths, title and cleanup function
 */
function createTempTestFile(prefix: string) {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random()*10000)}`;
  const uniqueBase = `${prefix}-${uniqueId}`;
  const uniqueFileName = `${uniqueBase}.mp3`;
  const uniqueTitle = `${BASE_TITLE}-${uniqueId}`;
  
  const testTmpDir = resolve(__dirname, '../test-tmp');
  const testFilePath = resolve(__dirname, './data/test.mp3');
  const tempUploadPath = join(testTmpDir, uniqueFileName);
  
  if (!existsSync(testTmpDir)) mkdirSync(testTmpDir);
  
  // Copy file first
  copyFileSync(testFilePath, tempUploadPath);
  
  // Update ID3 tags with unique title
  const tags = NodeID3.read(tempUploadPath);
  tags.title = uniqueTitle;
  NodeID3.write(tags, tempUploadPath);
  
  return {
    uniqueBase,
    uniqueTitle,
    tempUploadPath,
    cleanup: () => unlinkSync(tempUploadPath)
  };
}

/**
 * Helper to delete any existing tracks with a given title
 */
async function deleteExistingTracks(page: Page, title: string) {
  let trackCards = page.locator('[data-testid="track-card"]').filter({ hasText: title });
  let count = await trackCards.count();
  
  while (count > 0) {
    // Get fresh reference to first card each time
    const firstCard = trackCards.first();
    
    try {
      // Click delete and wait for confirmation dialog
      await firstCard.hover();
      const deleteButton = firstCard.getByRole('button', { name: /delete/i });
      await deleteButton.click();
      
      // Click confirm and wait for dialog to close
      const dialog = page.getByRole('dialog');
      const confirmButton = dialog.getByRole('button', { name: /delete/i, exact: true });
      await confirmButton.click();
      
      // Wait for dialog to close first
      await expect(dialog).toHaveCount(0);
      
      // Now wait for this specific card to disappear
      await expect(firstCard).toHaveCount(0);
      
      // Refresh track cards list and count
      trackCards = page.locator('[data-testid="track-card"]').filter({ hasText: title });
      count = await trackCards.count();
    } catch (e) {
      // If anything fails, refresh track cards list and count before retrying
      trackCards = page.locator('[data-testid="track-card"]').filter({ hasText: title });
      count = await trackCards.count();
      if (count === 0) break;
      console.log(`Retrying delete for "${title}" - ${count} cards remaining`);
    }
  }
}

/**
 * Helper to upload a test file and wait for its card to appear
 * Returns the track card locator
 */
async function uploadTestFile(page: Page, tempUploadPath: string, expectedTitle: string) {
  const uploadInput = page.locator('input[type="file"]');
  await uploadInput.setInputFiles(tempUploadPath);
  const trackCard = page.locator('[data-testid="track-card"]').filter({ hasText: expectedTitle });
  await expect(trackCard).toBeVisible({ timeout: TEST_TIMEOUTS.element });
  return trackCard;
}

/**
 * Helper to delete a track and verify it's gone
 */
async function deleteTrack(page: Page, trackCard: Locator) {
  await trackCard.hover();
  const deleteButton = trackCard.getByRole('button', { name: /delete/i });
  await deleteButton.click();
  const confirmButton = page.getByRole('button', { name: /delete/i, exact: true });
  await confirmButton.click();
  await expect(trackCard).toHaveCount(0, { timeout: TEST_TIMEOUTS.element });
}

/**
 * Helper to validate the download link on a track card
 */
async function validateDownloadLink(trackCard: Locator) {
  const downloadButton = trackCard.getByRole('button', { name: /download/i });
  const downloadLink = await downloadButton.evaluateHandle((btn) => btn.closest('a'));
  const href = await downloadLink.getProperty('href');
  expect(String(href)).toContain('.mp3');
  const hasDownloadAttr = await downloadButton.evaluate((btn) => {
    const link = btn.closest('a');
    return !!link && link.hasAttribute('download');
  });
  expect(hasDownloadAttr).toBeTruthy();
}

/**
 * Helper to fill an input field while triggering all necessary events
 */
async function forceFill(input: Locator, value: string) {
  await input.first().focus();
  await input.first().fill(value);
  await input.first().evaluate((el: HTMLInputElement, v: string) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.describe('Mixtape Web UI', () => {
  test('should load the homepage and list tracks', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Verify the app header is visible
    await expect(page.getByRole('heading', { level: 5, name: /mixtape/i })).toBeVisible();

    // Check for track cards
    const cards = page.locator('[data-testid="track-card"]');
    if (await cards.count() === 0) return; // Skip if no tracks exist

    // Verify at least one card is visible and interactive
    await expect(cards.first()).toBeVisible({ timeout: TEST_TIMEOUTS.element });
    expect(await cards.count()).toBeGreaterThan(0);

    // Check that card action buttons appear on hover
    const firstCard = cards.first();
    await firstCard.hover();
    await expect(firstCard.getByRole('button', { name: /edit/i })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should upload a track via the UI, confirm it appears, then delete it', async ({ page }) => {
    await page.goto('/');
    
    // Create a temporary test file with unique ID3 title
    const { tempUploadPath, uniqueTitle, cleanup } = createTempTestFile('ui-upload-test');

    try {
      // Upload the file and wait for card to appear
      const trackCard = await uploadTestFile(page, tempUploadPath, uniqueTitle);

      // Validate the file upload was successful
      await validateDownloadLink(trackCard);

      // Clean up by deleting the track
      await deleteTrack(page, trackCard);
    } finally {
      cleanup();
    }
  });

  test('should play (stream) a track uploaded via the UI', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Audio playback test is skipped on WebKit due to browser limitations.');
    await page.goto('/');
    
    // Create and upload test file with unique ID3 title
    const { tempUploadPath, uniqueTitle, cleanup } = createTempTestFile('ui-upload-test-play');

    try {
      const trackCard = await uploadTestFile(page, tempUploadPath, uniqueTitle);

      // Test playback
      await trackCard.hover();
      const playButton = trackCard.getByRole('button', { name: /play/i });
      await playButton.click();

      // Verify player bar appears with correct track
      const playerBar = page.getByRole('region', { name: /player/i });
      await expect(playerBar.getByText(uniqueTitle)).toBeVisible({ timeout: TEST_TIMEOUTS.playerBar });

      // Verify audio element
      const audio = playerBar.locator('audio');
      await expect(audio).toBeAttached();
      const src = await audio.getAttribute('src');
      expect(src).toContain('.mp3');
    } finally {
      cleanup();
    }
  });

  test('should download a track uploaded via the UI as an MP3', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Download event is not supported in WebKit by Playwright.');
    await page.goto('/');
    
    // Create and upload test file with unique ID3 title
    const { tempUploadPath, uniqueTitle, cleanup } = createTempTestFile('ui-upload-test-dl');

    try {
      const trackCard = await uploadTestFile(page, tempUploadPath, uniqueTitle);

      // Verify download functionality
      await trackCard.hover();
      await validateDownloadLink(trackCard);
    } finally {
      cleanup();
    }
  });

  test('should edit track metadata via the UI', async ({ page }) => {
    await page.goto('/');
    
    // Create and upload test file with unique ID3 title
    const { tempUploadPath, uniqueTitle, uniqueBase, cleanup } = createTempTestFile('ui-upload-test-edit');

    try {
      const trackCard = await uploadTestFile(page, tempUploadPath, uniqueTitle);

      // Open edit form
      await trackCard.hover();
      const editButton = trackCard.getByRole('button', { name: 'Edit' });
      await expect(editButton).toBeVisible({ timeout: TEST_TIMEOUTS.edit });
      await editButton.click();
      await page.waitForTimeout(100);

      // Verify form fields are visible
      const titleInput = page.locator('input[data-testid="edit-title"]');
      const artistInput = page.locator('input[data-testid="edit-artist"]');
      const albumInput = page.locator('input[data-testid="edit-album"]');
      const trackInput = page.locator('input[data-testid="edit-track"]');
      await expect(titleInput).toBeVisible({ timeout: TEST_TIMEOUTS.form });
      await expect(artistInput).toBeVisible();
      await expect(albumInput).toBeVisible();
      await expect(trackInput).toBeVisible();

      // Update metadata
      await forceFill(titleInput, uniqueBase);
      await forceFill(artistInput, 'Test Artist');
      await forceFill(albumInput, 'Test Album');
      await forceFill(trackInput, '42');

      // Save changes
      const saveButton = page.getByRole('button', { name: 'Save' });
      await saveButton.click();
      await expect(titleInput).toHaveCount(0, { timeout: TEST_TIMEOUTS.form });

      // After edit, we need to find the card by its new title
      const updatedCard = page.locator('[data-testid="track-card"]').filter({ hasText: uniqueBase });
      await expect(updatedCard).toBeVisible({ timeout: TEST_TIMEOUTS.element });
      
      // Verify all metadata updates are visible
      await expect(updatedCard.getByText('Test Artist')).toBeVisible();
      await expect(updatedCard.getByText('Test Album')).toBeVisible();

      // Clean up by deleting the track
      await deleteTrack(page, updatedCard);
    } finally {
      cleanup();
    }
  });
});