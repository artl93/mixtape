import { expect } from '@playwright/test';
import { test } from './utils/fixtures';
import { TEST_TIMEOUTS, TEST_METADATA } from './utils/constants';

test.describe('Mixtape Web UI', () => {
  test('should load the homepage and list tracks', async ({ cleanPage: page }) => {
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

  test('should upload a track via the UI, confirm it appears, then delete it', async ({ cleanPage: page, testHelpers }) => {
    const { tempUploadPath, uniqueTitle, cleanup } = testHelpers.createTempTestFile('ui-upload-test');

    try {
      // Upload the file and wait for card to appear
      const trackCard = await testHelpers.uploadTestFile(tempUploadPath, uniqueTitle);

      // Validate the file upload was successful
      await testHelpers.validateDownloadLink(trackCard);

      // Clean up by deleting the track
      await testHelpers.deleteTrack(trackCard);
    } finally {
      cleanup();
    }
  });

  test('should play (stream) a track uploaded via the UI', async ({ cleanPage: page, testHelpers, browserName }) => {
    test.skip(browserName === 'webkit', 'Audio playback test is skipped on WebKit due to browser limitations.');
    
    const { tempUploadPath, uniqueTitle, cleanup } = testHelpers.createTempTestFile('ui-upload-test-play');

    try {
      const trackCard = await testHelpers.uploadTestFile(tempUploadPath, uniqueTitle);

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

  test('should download a track uploaded via the UI as an MP3', async ({ cleanPage: page, testHelpers, browserName }) => {
    test.skip(browserName === 'webkit', 'Download event is not supported in WebKit by Playwright.');
    
    const { tempUploadPath, uniqueTitle, cleanup } = testHelpers.createTempTestFile('ui-upload-test-dl');

    try {
      const trackCard = await testHelpers.uploadTestFile(tempUploadPath, uniqueTitle);

      // Verify download functionality
      await trackCard.hover();
      await testHelpers.validateDownloadLink(trackCard);
    } finally {
      cleanup();
    }
  });

  test('should edit track metadata via the UI', async ({ cleanPage: page, testHelpers }) => {
    const { tempUploadPath, uniqueTitle, uniqueBase, cleanup } = testHelpers.createTempTestFile('ui-upload-test-edit');

    try {
      const trackCard = await testHelpers.uploadTestFile(tempUploadPath, uniqueTitle);

      // Open edit form
      await trackCard.hover();
      const editButton = trackCard.getByRole('button', { name: 'Edit' });
      await expect(editButton).toBeVisible({ timeout: TEST_TIMEOUTS.edit });
      await editButton.click();
      await page.waitForTimeout(100);

      // Get form fields
      const titleInput = page.locator('input[data-testid="edit-title"]');
      const artistInput = page.locator('input[data-testid="edit-artist"]');
      const albumInput = page.locator('input[data-testid="edit-album"]');
      const trackInput = page.locator('input[data-testid="edit-track"]');

      // Verify fields are visible
      await expect(titleInput).toBeVisible({ timeout: TEST_TIMEOUTS.form });
      await expect(artistInput).toBeVisible();
      await expect(albumInput).toBeVisible();
      await expect(trackInput).toBeVisible();

      // Update metadata
      await testHelpers.forceFill(titleInput, uniqueBase);
      await testHelpers.forceFill(artistInput, TEST_METADATA.artist);
      await testHelpers.forceFill(albumInput, TEST_METADATA.album);
      await testHelpers.forceFill(trackInput, TEST_METADATA.trackNumber);

      // Save changes
      const saveButton = page.getByRole('button', { name: 'Save' });
      await saveButton.click();
      await expect(titleInput).toHaveCount(0, { timeout: TEST_TIMEOUTS.form });

      // Find the updated card and verify metadata
      const updatedCard = page.locator('[data-testid="track-card"]').filter({ hasText: uniqueBase });
      await expect(updatedCard).toBeVisible({ timeout: TEST_TIMEOUTS.element });
      await expect(updatedCard.getByText(TEST_METADATA.artist)).toBeVisible();
      await expect(updatedCard.getByText(TEST_METADATA.album)).toBeVisible();

      // Clean up
      await testHelpers.deleteTrack(updatedCard);
    } finally {
      cleanup();
    }
  });
});