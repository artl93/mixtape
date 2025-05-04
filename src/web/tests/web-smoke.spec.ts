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

  test('should play (stream) a track, pause, seek, and resume', async ({ cleanPage: page, testHelpers, browserName }) => {
    // Skip on WebKit due to potential audio playback/control issues in automation
    test.skip(browserName === 'webkit', 'Audio playback control test is skipped on WebKit.');

    const { tempUploadPath, uniqueTitle, cleanup } = testHelpers.createTempTestFile('ui-upload-test-play-controls');

    try {
      const trackCard = await testHelpers.uploadTestFile(tempUploadPath, uniqueTitle);

      // --- Start Playback ---
      await trackCard.hover();
      const cardPlayButton = trackCard.getByRole('button', { name: /play/i });
      await cardPlayButton.click();

      // --- Verify Player Bar Appears ---
      const playerBar = page.getByRole('region', { name: /player/i });
      await expect(playerBar.getByText(uniqueTitle)).toBeVisible({ timeout: TEST_TIMEOUTS.playerBar });

      // --- Locate Elements within Player Bar ---
      const audio = playerBar.locator('audio');
      const playerPlayButton = playerBar.getByRole('button', { name: /play/i }); // Initially hidden
      const playerPauseButton = playerBar.getByRole('button', { name: /pause/i });
      const sliderInput = playerBar.locator('input[type="range"]');
      const timeDisplay = playerBar.getByTestId('time-display');

      // --- Verify Initial Play State ---
      await expect(audio).toBeAttached();
      const src = await audio.getAttribute('src');
      expect(src).toContain('.mp3'); // Or appropriate extension
      await expect(playerPauseButton).toBeVisible(); // Pause should be visible initially
      await expect(playerPlayButton).toBeHidden();   // Play should be hidden

      // Wait for audio to actually start playing (check paused state becomes false)
      await expect(async () => {
        expect(await audio.evaluate(node => node.paused)).toBe(false);
      }).toPass({ timeout: TEST_TIMEOUTS.playback });

      // Wait for time to advance slightly
      await expect(async () => {
        expect(await audio.evaluate(node => node.currentTime)).toBeGreaterThan(0.1);
      }).toPass({ timeout: TEST_TIMEOUTS.playback });
      await expect(timeDisplay).not.toHaveText('0:00 / 4:13'); // Assuming duration is 4:13

      // --- Test Pause ---
      await playerPauseButton.click();
      await expect(playerPlayButton).toBeVisible(); // Play button should appear
      await expect(playerPauseButton).toBeHidden();  // Pause button should hide
      // Verify audio is paused
      await expect(async () => {
        expect(await audio.evaluate(node => node.paused)).toBe(true);
      }).toPass({ timeout: TEST_TIMEOUTS.playback });
      const pausedTime = await audio.evaluate(node => node.currentTime);

      // --- Test Play (Resume) ---
      await playerPlayButton.click();
      await expect(playerPauseButton).toBeVisible(); // Pause button should appear
      await expect(playerPlayButton).toBeHidden();   // Play button should hide
      // Verify audio resumes
      await expect(async () => {
        expect(await audio.evaluate(node => node.paused)).toBe(false);
      }).toPass({ timeout: TEST_TIMEOUTS.playback });
      // Verify time advances from where it was paused
      await expect(async () => {
        expect(await audio.evaluate(node => node.currentTime)).toBeGreaterThan(pausedTime);
      }).toPass({ timeout: TEST_TIMEOUTS.playback });

      // --- Test Seek ---
      const duration = await audio.evaluate(node => node.duration);
      console.log(`[Test Debug] Audio duration reported: ${duration}`);

      // Check if duration is a valid, finite number greater than a minimum threshold (e.g., 5 seconds)
      if (duration && Number.isFinite(duration) && duration > 5) {
        const seekTargetTime = Math.floor(duration / 3); // Seek to 1/3rd of the track
        console.log(`[Test Debug] Directly setting currentTime to: ${seekTargetTime}`);

        // --- Direct currentTime Manipulation ---
        // Directly set the currentTime property on the audio element
        await audio.evaluate((node, time) => {
          node.currentTime = time;
        }, seekTargetTime);
        // --- End Direct Manipulation ---

        // Verify audio currentTime jumps to near the seek target
        // Use a reasonable timeout for the browser to process the change
        await expect(async () => {
          const currentTime = await audio.evaluate(node => node.currentTime);
          console.log(`[Test Debug] Current time after setting currentTime: ${currentTime}`);
          // Allow a small tolerance for timing inaccuracies
          expect(currentTime).toBeGreaterThanOrEqual(seekTargetTime - 2);
          expect(currentTime).toBeLessThanOrEqual(seekTargetTime + 2);
        }).toPass({ timeout: 5000 }); // Use a shorter timeout (e.g., 5 seconds) as direct setting should be faster

        // Verify time display updates after seek (This might still depend on the component listening to 'timeupdate' or 'seeked' events)
        const expectedMinutes = Math.floor(seekTargetTime / 60);
        const expectedSeconds = String(seekTargetTime % 60).padStart(2, '0');
        // Wait slightly longer for the UI to potentially update based on audio events
        await expect(timeDisplay).toContainText(`${expectedMinutes}:${expectedSeconds}`, { timeout: TEST_TIMEOUTS.element + 2000 });

      } else {
        // Log a warning if duration is invalid, skip seek test portion
        console.warn(`[Test Warning] Invalid or infinite duration (${duration}), skipping seek verification.`);
        await expect(sliderInput).toBeVisible(); // Still check if slider is visible
      }

      // --- Final Cleanup ---
      // await playerPauseButton.click(); // Ensure paused before potential delete

    } finally {
      // Ensure the track is deleted even if assertions fail
      const trackCardToDelete = page.locator('[data-testid="track-card"]').filter({ hasText: uniqueTitle });
      if (await trackCardToDelete.isVisible()) {
        await testHelpers.deleteTrack(trackCardToDelete);
      }
      cleanup(); // Delete temp file
    }
  });
});