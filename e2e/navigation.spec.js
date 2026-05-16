import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('player page is the default route', async ({ page }) => {
  await expect(page.getByTestId('page-player')).toBeVisible();
  await expect(page.getByTestId('page-dm')).toHaveCount(0);
  await expect(page.getByTestId('nav-player')).toHaveAttribute('data-active', 'true');
});

test('clicking the DM link navigates to the DM page', async ({ page }) => {
  await page.getByTestId('nav-dm').click();
  await expect(page.getByTestId('page-dm')).toBeVisible();
  await expect(page.getByTestId('page-player')).toHaveCount(0);
  await expect(page.getByTestId('nav-dm')).toHaveAttribute('data-active', 'true');
});

test('DM page opens on the Combat tab by default', async ({ page }) => {
  await page.getByTestId('nav-dm').click();
  await expect(page.getByTestId('dm-combat-panel')).toBeVisible();
  await expect(page.getByTestId('dm-tab-combat')).toHaveAttribute('data-active', 'true');
});

test('switching DM tabs swaps the inner panel', async ({ page }) => {
  await page.getByTestId('nav-dm').click();

  await page.getByTestId('dm-tab-characters').click();
  await expect(page.getByTestId('dm-characters-panel')).toBeVisible();
  await expect(page.getByTestId('dm-combat-panel')).toHaveCount(0);

  await page.getByTestId('dm-tab-weapons').click();
  await expect(page.getByTestId('dm-weapons-panel')).toBeVisible();
  await expect(page.getByTestId('dm-characters-panel')).toHaveCount(0);

  await page.getByTestId('dm-tab-combat').click();
  await expect(page.getByTestId('dm-combat-panel')).toBeVisible();
});

test('navigating back to the player page works', async ({ page }) => {
  await page.getByTestId('nav-dm').click();
  await expect(page.getByTestId('page-dm')).toBeVisible();

  await page.getByTestId('nav-player').click();
  await expect(page.getByTestId('page-player')).toBeVisible();
  await expect(page.getByTestId('page-dm')).toHaveCount(0);
});

test('deep-linking to #/dm loads the DM page directly', async ({ page }) => {
  await page.goto('/#/dm');
  await expect(page.getByTestId('page-dm')).toBeVisible();
  await expect(page.getByTestId('nav-dm')).toHaveAttribute('data-active', 'true');
});
