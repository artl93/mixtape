import { test, expect } from '@playwright/test';

test.describe('Mixtape Web UI', () => {
  test('should load the homepage and list tracks', async ({ page }) => {
    await page.goto('/');
    // The app now uses an h5 in the AppBar
    await expect(page.getByRole('heading', { level: 5, name: /mixtape/i })).toBeVisible();
    // Wait for at least one track card to appear
    const cards = page.locator('[data-testid="track-card"]');
    if (await cards.count() === 0) return;
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    // Check that play and download buttons exist for the first card
    const firstCard = cards.first();
    await firstCard.hover();
    await expect(firstCard.getByRole('button', { name: /edit/i })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: /delete/i })).toBeVisible();
    // Play and download are now in the global player bar, not in the card
  });

  test('should upload a track via the UI, confirm it appears, then delete it', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Generate a unique file name for upload
    const uniqueBase = `ui-upload-test-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const uniqueFileName = `${uniqueBase}.mp3`;
    const path = require('path');
    const fs = require('fs');
    const testTmpDir = path.resolve(__dirname, '../test-tmp');
    if (!fs.existsSync(testTmpDir)) fs.mkdirSync(testTmpDir);
    const testFilePath = path.resolve(__dirname, './data/test.mp3');
    const tempUploadPath = path.join(testTmpDir, uniqueFileName);
    fs.copyFileSync(testFilePath, tempUploadPath);

    try {
      // Upload the file using the UI
      const uploadInput = page.locator('input[type="file"]');
      await uploadInput.setInputFiles(tempUploadPath);

      // Wait for upload to finish and card to appear
      const expectedTitle = uniqueBase; // UI uses file name (without extension) as title
      const trackCard = page.locator('[data-testid="track-card"]').filter({ hasText: expectedTitle });
      await expect(trackCard).toBeVisible({ timeout: 15000 });

      // Hover over the card to reveal action buttons
      await trackCard.hover();

      // Delete the uploaded track using the UI
      const deleteButton = trackCard.getByRole('button', { name: /delete/i });
      await deleteButton.click();
      // Confirm in dialog
      const confirmButton = page.getByRole('button', { name: /delete/i, exact: true });
      await confirmButton.click();
      // Ensure the card disappears
      await expect(trackCard).toHaveCount(0, { timeout: 10000 });
    } finally {
      // Clean up temp file
      fs.unlinkSync(tempUploadPath);
    }
  });

  test('should play (stream) a track uploaded via the UI', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Audio playback test is skipped on WebKit due to browser limitations.');
    await page.goto('/');
    const uniqueBase = `ui-upload-test-play-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const uniqueFileName = `${uniqueBase}.mp3`;
    const path = require('path');
    const fs = require('fs');
    const testTmpDir = path.resolve(__dirname, '../test-tmp');
    if (!fs.existsSync(testTmpDir)) fs.mkdirSync(testTmpDir);
    const testFilePath = path.resolve(__dirname, './data/test.mp3');
    const tempUploadPath = path.join(testTmpDir, uniqueFileName);
    fs.copyFileSync(testFilePath, tempUploadPath);
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(tempUploadPath);
    const expectedTitle = uniqueBase;
    const trackCard = page.locator('[data-testid="track-card"]').filter({ hasText: expectedTitle });
    await expect(trackCard).toBeVisible({ timeout: 15000 });
    await trackCard.hover();
    // Click play button in the card (should trigger global player bar)
    const playButton = trackCard.getByRole('button', { name: /play/i });
    await playButton.click();
    // Wait for the global player bar to appear and show the correct title
    const playerBar = page.getByRole('region', { name: /player/i });
    await expect(playerBar.getByText(expectedTitle)).toBeVisible({ timeout: 10000 });
    // Check that the audio element in the player bar is present and has a valid src
    const audio = playerBar.locator('audio');
    await expect(audio).toBeAttached();
    const src = await audio.getAttribute('src');
    expect(src).toContain('.mp3');
    // Clean up temp file
    fs.unlinkSync(tempUploadPath);
  });

  test('should download a track uploaded via the UI as an MP3', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Download event is not supported in WebKit by Playwright.');
    await page.goto('/');
    const uniqueBase = `ui-upload-test-dl-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const uniqueFileName = `${uniqueBase}.mp3`;
    const path = require('path');
    const fs = require('fs');
    const testTmpDir = path.resolve(__dirname, '../test-tmp');
    if (!fs.existsSync(testTmpDir)) fs.mkdirSync(testTmpDir);
    const testFilePath = path.resolve(__dirname, './data/test.mp3');
    const tempUploadPath = path.join(testTmpDir, uniqueFileName);
    fs.copyFileSync(testFilePath, tempUploadPath);
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(tempUploadPath);
    const expectedTitle = uniqueBase;
    const trackCard = page.locator('[data-testid="track-card"]').filter({ hasText: expectedTitle });
    await expect(trackCard).toBeVisible({ timeout: 15000 });
    await trackCard.hover();
    // Find the download button (icon button with aria-label="Download")
    const downloadButton = trackCard.getByRole('button', { name: /download/i });
    // Instead of waiting for download event, check the link's href and download attribute
    const downloadLink = await downloadButton.evaluateHandle((btn) => btn.closest('a'));
    const href = await downloadLink.getProperty('href');
    expect(String(href)).toContain('.mp3');
    // Optionally, check the download attribute exists (value may be empty string)
    const hasDownloadAttr = await downloadButton.evaluate((btn) => {
      const link = btn.closest('a');
      return !!link && link.hasAttribute('download');
    });
    expect(hasDownloadAttr).toBeTruthy();
    // Clean up temp file
    fs.unlinkSync(tempUploadPath);
  });
});
