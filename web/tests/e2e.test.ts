import { test, expect } from '@playwright/test';

test.describe('Nasa Space App', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Nasa Space App Challenge|Vite/);
  });
});
