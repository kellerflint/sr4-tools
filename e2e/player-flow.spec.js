import { test, expect } from '@playwright/test';

// Every test starts with a clean slate — the app persists state to
// localStorage, so we clear it before navigating and reload to pick up
// fresh defaults.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('default dice pool is Agility + Firearms (4 + 4)', async ({ page }) => {
  await expect(page.getByTestId('dice-pool')).toHaveText('8');
});

test('selecting medium range subtracts 1 die', async ({ page }) => {
  await page.getByTestId('range-medium').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('7');
});

test('selecting extreme range subtracts 6 dice', async ({ page }) => {
  await page.getByTestId('range-extreme').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('2');
});

test('burst fire applies uncompensated recoil', async ({ page }) => {
  await page.getByTestId('firing-mode-bf-narrow').click();
  // BF narrow has 2 recoil, RC defaults to 0 → 8 − 2
  await expect(page.getByTestId('dice-pool')).toHaveText('6');
});

test('recoil compensation cancels recoil one-for-one', async ({ page }) => {
  await page.getByTestId('firing-mode-bf-narrow').click();
  await page.getByTestId('stat-recoil-comp-inc').click();
  await page.getByTestId('stat-recoil-comp-inc').click();
  // BF recoil 2, RC 2 → fully compensated → 8
  await expect(page.getByTestId('dice-pool')).toHaveText('8');
});

test('smartlink adds +2 dice', async ({ page }) => {
  await page.getByTestId('toggle-smartlink').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('10');
});

test('aim actions add +1 dice each', async ({ page }) => {
  await page.getByTestId('aim-inc').click();
  await page.getByTestId('aim-inc').click();
  await page.getByTestId('aim-inc').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('11');
});

test('called shot subtracts 4 dice', async ({ page }) => {
  await page.getByTestId('mod-called-shot').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('4');
});

test('exclusive cover options replace each other', async ({ page }) => {
  await page.getByTestId('mod-cov-partial').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('6'); // -2
  await page.getByTestId('mod-cov-good').click();
  await expect(page.getByTestId('dice-pool')).toHaveText('4'); // -4 replaces -2
});

test('rolling produces hit count and dice in the result panel', async ({ page }) => {
  await page.getByTestId('roll-button').click();
  await expect(page.getByTestId('roll-result')).toBeVisible();
  const hits = await page.getByTestId('roll-hits').textContent();
  expect(Number(hits)).toBeGreaterThanOrEqual(0);
  expect(Number(hits)).toBeLessThanOrEqual(8);
});

test('Reset roll clears the roll display but keeps form state', async ({ page }) => {
  await page.getByTestId('range-medium').click();
  await page.getByTestId('roll-button').click();
  await expect(page.getByTestId('roll-result')).toBeVisible();

  await page.getByTestId('reset-roll').click();
  await expect(page.getByTestId('roll-result')).toBeHidden();
  // Form should still have medium selected (still -1 dice)
  await expect(page.getByTestId('dice-pool')).toHaveText('7');
  await expect(page.getByTestId('range-medium')).toHaveAttribute('data-active', 'true');
});

test('Reset shot wipes the form back to defaults', async ({ page }) => {
  await page.getByTestId('range-extreme').click();
  await page.getByTestId('mod-called-shot').click();
  await page.getByTestId('toggle-smartlink').click();
  await expect(page.getByTestId('dice-pool')).not.toHaveText('8');

  await page.getByTestId('reset-shot').click();

  // Stats (smartlink) are NOT reset — only the shot config.
  // Range goes back to short, modifier clears.
  await expect(page.getByTestId('range-short')).toHaveAttribute('data-active', 'true');
  await expect(page.getByTestId('mod-called-shot')).toHaveAttribute('data-active', 'false');
});

test('damage panel shows base DV from the weapon', async ({ page }) => {
  await expect(page.getByTestId('damage-dv')).toHaveText('5P');
  await expect(page.getByTestId('damage-ap')).toHaveText('0');
});

test('APDS ammo sets AP to −4 without changing DV', async ({ page }) => {
  await page.getByTestId('ammo-apds').click();
  await expect(page.getByTestId('damage-dv')).toHaveText('5P');
  await expect(page.getByTestId('damage-ap')).toHaveText('-4');
});

test('Gel rounds flip damage type to Stun and add +2 DV', async ({ page }) => {
  await page.getByTestId('ammo-gel').click();
  await expect(page.getByTestId('damage-dv')).toHaveText('7S');
});

test('Direct net hits raise final DV', async ({ page }) => {
  await page.getByTestId('net-hits-inc').click();
  await page.getByTestId('net-hits-inc').click();
  await page.getByTestId('net-hits-inc').click();
  // Base 5 + 3 net hits = 8
  await expect(page.getByTestId('damage-dv')).toHaveText('8P');
});

test('Firing-mode bonus stacks with net hits for final DV', async ({ page }) => {
  // BF narrow = +2 DV, then 3 net hits = +3 → 10P total
  await page.getByTestId('firing-mode-bf-narrow').click();
  for (let i = 0; i < 3; i++) await page.getByTestId('net-hits-inc').click();
  await expect(page.getByTestId('damage-dv')).toHaveText('10P');
});

test('state persists across reload', async ({ page }) => {
  await page.getByTestId('range-long').click();
  await page.getByTestId('toggle-smartlink').click();
  await page.reload();
  await expect(page.getByTestId('range-long')).toHaveAttribute('data-active', 'true');
  await expect(page.getByTestId('toggle-smartlink')).toHaveAttribute('data-checked', 'true');
  // Pool = 8 + 2 smartlink - 3 long = 7
  await expect(page.getByTestId('dice-pool')).toHaveText('7');
});
