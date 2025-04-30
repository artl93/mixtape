import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Test fixture type with helper methods
 */
type TestFixtures = {
  testHelpers: TestHelpers;
  cleanPage: Page;
};

/**
 * Extended test object with fixtures
 */
export const test = base.extend<TestFixtures>({
  // Add TestHelpers to fixtures
  testHelpers: async ({ page }, use) => {
    await use(new TestHelpers(page));
  },

  // Add a clean page fixture that always starts at home
  cleanPage: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  }
});
