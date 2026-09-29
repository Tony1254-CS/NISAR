import { test, expect } from '@playwright/test';

test.describe('FluviSAR', () => {
  test('loads without crashing and shows the top bar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NASA App Web/);
    await expect(page.getByText('FLUVISAR')).toBeVisible();
  });

  test('/methods renders the methods page', async ({ page }) => {
    await page.goto('/methods');
    await expect(page.getByRole('heading', { name: 'Methods' })).toBeVisible();
  });
});
