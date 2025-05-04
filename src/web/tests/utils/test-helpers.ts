import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import NodeID3 from 'node-id3';
import { TEST_TIMEOUTS, BASE_TITLE } from './constants';

/**
 * Helper class for managing test files and UI interactions
 */
export class TestHelpers {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Creates a temporary test file with unique ID3 tags
   * @param prefix - Prefix for the unique filename and title
   * @returns Object containing paths, title and cleanup function
   */
  createTempTestFile(prefix: string) {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const uniqueBase = `${prefix}-${uniqueId}`;
    const uniqueFileName = `${uniqueBase}.mp3`;
    const uniqueTitle = `${BASE_TITLE}-${uniqueId}`;
    
    const testTmpDir = resolve(__dirname, '../../test-tmp');
    const testFilePath = resolve(__dirname, '../../tests/data/test.mp3');
    const tempUploadPath = join(testTmpDir, uniqueFileName);
    
    if (!existsSync(testTmpDir)) mkdirSync(testTmpDir);
    
    // Copy file and update ID3 tags
    copyFileSync(testFilePath, tempUploadPath);
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
   * Helper to upload a test file and wait for its card to appear
   */
  async uploadTestFile(tempUploadPath: string, expectedTitle: string) {
    const uploadInput = this.page.locator('input[type="file"]');
    await uploadInput.setInputFiles(tempUploadPath);
    const trackCard = this.page.locator('[data-testid="track-card"]').filter({ hasText: expectedTitle });
    await expect(trackCard).toBeVisible({ timeout: TEST_TIMEOUTS.element });
    return trackCard;
  }

  /**
   * Helper to delete a track and verify it's gone
   */
  async deleteTrack(trackCard: Locator) {
    await trackCard.hover();
    const deleteButton = trackCard.getByRole('button', { name: /delete/i });
    await deleteButton.click();
    
    const confirmButton = this.page.getByRole('button', { name: /delete/i, exact: true });
    await confirmButton.click();
    
    await expect(trackCard).toHaveCount(0, { timeout: TEST_TIMEOUTS.element });
  }

  /**
   * Helper to validate the download link on a track card
   */
  async validateDownloadLink(trackCard: Locator) {
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
  async forceFill(input: Locator, value: string) {
    await input.first().focus();
    await input.first().fill(value);
    await input.first().evaluate((el: HTMLInputElement, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }
}
