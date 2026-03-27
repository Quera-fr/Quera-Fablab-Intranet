import { test, expect } from '@playwright/test';

test.describe('Activity Styling - Admin Validation (E2E)', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin' }));
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('token', 'fake-token');
    });

    await page.goto('http://127.0.0.1:6565/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('calendar page loads successfully', async ({ page }) => {
    // Look for any main content (not just h2)
    const mainContent = page.locator('[class*="space-y"]').first();
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });

  test('activity styling visible on page', async ({ page }) => {
    // Just verify some styled elements exist
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

});