import { test, expect } from '@playwright/test';
import { uploadTestTrack } from './upload-util';

test.describe('Mixtape Web UI', () => {
  test.beforeAll(async () => {
    // Upload a test track before running the UI test
    await uploadTestTrack();
  });
  test('should load the homepage and list tracks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3')).toHaveText(/mixtape/i);
    // Wait for at least one track card to appear (robust for all browsers)
    const cards = page.locator('[data-testid="track-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    // Check that play and download buttons exist for the first card
    const firstCard = cards.first();
    await expect(firstCard.getByRole('button', { name: /play/i })).toBeVisible();
    await expect(firstCard.getByRole('link', { name: /download/i })).toBeVisible();
  });
  test('should play (stream) the uploaded track', async ({ page }) => {
    const uniqueTitle = `Web Test Track ${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const uploadedTrack = await uploadTestTrack(uniqueTitle);
    await page.goto('/');
    // Find the card for the uploaded track by its unique title
    const trackCard = page.locator('[data-testid="track-card"]').filter({ hasText: uniqueTitle });
    await expect(trackCard).toBeVisible({ timeout: 10000 });
    const playButton = trackCard.getByRole('button', { name: /play/i });
    await playButton.click();
    // Audio element should appear
    const audio = trackCard.locator('audio');
    await expect(audio).toBeVisible();
    // Audio src should be a valid URL for the uploaded file
    const src = await audio.getAttribute('src');
    expect(src).toContain(uploadedTrack.file_url);
  });

  test('should download the uploaded track as an MP3', async ({ page }) => {
    const uniqueTitle = `Web Test Track ${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const uploadedTrack = await uploadTestTrack(uniqueTitle);
    await page.goto('/');
    // Find the card for the uploaded track by its unique title
    const trackCard = page.locator('[data-testid="track-card"]').filter({ hasText: uniqueTitle });
    await expect(trackCard).toBeVisible({ timeout: 10000 });
    const downloadLink = trackCard.getByRole('link', { name: /download/i });
    // Intercept the download
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      downloadLink.click(),
    ]);
    // Save the file to a temp path
    const savePath = 'downloaded-test.mp3';
    await download.saveAs(savePath);
    // Check file extension
    expect(savePath.endsWith('.mp3')).toBeTruthy();
    // Optionally, check file size > 0
    const fs = require('fs');
    const stat = fs.statSync(savePath);
    expect(stat.size).toBeGreaterThan(0);
    // Clean up
    fs.unlinkSync(savePath);
  });
});
