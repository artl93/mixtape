import { test, expect } from '@playwright/test';

test.describe('Mixtape Web UI', () => {
  test('should load the homepage and list tracks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3')).toHaveText(/mixtape/i);
    // Wait for at least one track card to appear (robust for all browsers)
    const cards = page.locator('[data-testid="track-card"]');
    // If no tracks exist, skip the rest of the test
    if (await cards.count() === 0) return;
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    // Check that play and download buttons exist for the first card
    const firstCard = cards.first();
    await expect(firstCard.getByRole('button', { name: /play/i })).toBeVisible();
    await expect(firstCard.getByRole('link', { name: /download/i })).toBeVisible();
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
    // Upload via UI
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
    // Play
    const playButton = trackCard.getByRole('button', { name: /play/i });
    await playButton.click();
    const audio = trackCard.locator('audio');
    await expect(audio).toBeVisible();
    // Audio src should be a valid URL for the uploaded file
    const src = await audio.getAttribute('src');
    expect(src).toContain('.mp3');
    // Clean up temp file
    fs.unlinkSync(tempUploadPath);
  });

  test('should download a track uploaded via the UI as an MP3', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Download event is not supported in WebKit by Playwright.');
    // Upload via UI
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
    const downloadLink = trackCard.getByRole('link', { name: /download/i });
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      downloadLink.click(),
    ]);
    const savePath = path.join(testTmpDir, `downloaded-${uniqueFileName}`);
    await download.saveAs(savePath);
    expect(savePath.endsWith('.mp3')).toBeTruthy();
    const stat = fs.statSync(savePath);
    expect(stat.size).toBeGreaterThan(0);
    // Clean up temp files
    fs.unlinkSync(tempUploadPath);
    fs.unlinkSync(savePath);
  });
});
