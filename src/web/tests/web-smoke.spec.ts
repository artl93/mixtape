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
});
