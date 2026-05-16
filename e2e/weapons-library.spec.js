import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/dm');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByTestId('dm-tab-weapons').click();
});

test('empty state shown when no weapons exist', async ({ page }) => {
  await expect(page.getByTestId('weapon-row')).toHaveCount(0);
  await expect(page.getByTestId('weapon-add-button')).toBeVisible();
});

test('add button opens an empty form', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await expect(page.getByTestId('weapon-form')).toBeVisible();
  await expect(page.getByTestId('weapon-name-input')).toHaveValue('');
});

test('save is disabled until a name is entered', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await expect(page.getByTestId('weapon-save')).toBeDisabled();
  await page.getByTestId('weapon-name-input').fill('Heavy Pistol');
  await expect(page.getByTestId('weapon-save')).toBeEnabled();
});

test('adding a ranged weapon creates a row with the right summary', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill('Heavy Pistol');
  await page.getByTestId('weapon-save').click();

  await expect(page.getByTestId('weapon-row')).toHaveCount(1);
  const row = page.getByTestId('weapon-row').first();
  await expect(row.getByTestId('weapon-row-name')).toHaveText('Heavy Pistol');
  await expect(row.getByTestId('weapon-row-kind')).toHaveText('ranged');
  // Default DV 5P, AP 0, modes SS/SA, RC 0
  await expect(row.getByTestId('weapon-row-summary')).toContainText('DV 5P');
  await expect(row.getByTestId('weapon-row-summary')).toContainText('SS/SA');
});

test('switching kind to Melee shows the reach field instead of ranged-only fields', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await expect(page.getByTestId('weapon-ranged-fields')).toBeVisible();

  await page.getByTestId('weapon-kind-melee').click();
  await expect(page.getByTestId('weapon-melee-fields')).toBeVisible();
  await expect(page.getByTestId('weapon-ranged-fields')).toHaveCount(0);
});

test('adding a melee weapon stores the reach value in the summary', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill('Katana');
  await page.getByTestId('weapon-kind-melee').click();
  await page.getByTestId('weapon-reach-inc').click(); // 0 → 1
  await page.getByTestId('weapon-save').click();

  const row = page.getByTestId('weapon-row').first();
  await expect(row.getByTestId('weapon-row-kind')).toHaveText('melee');
  await expect(row.getByTestId('weapon-row-summary')).toContainText('Reach 1');
});

test('editing a weapon updates its summary', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill('Heavy Pistol');
  await page.getByTestId('weapon-save').click();

  await page.getByTestId('weapon-row').first().getByTestId('weapon-row-edit').click();
  // Form should be prefilled
  await expect(page.getByTestId('weapon-name-input')).toHaveValue('Heavy Pistol');
  // Bump DV from 5 to 6
  await page.getByTestId('weapon-dv-inc').click();
  await page.getByTestId('weapon-save').click();

  await expect(page.getByTestId('weapon-row').first().getByTestId('weapon-row-summary')).toContainText('DV 6P');
});

test('cancel discards an in-progress edit', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill('Will not save');
  await page.getByTestId('weapon-cancel').click();
  await expect(page.getByTestId('weapon-form')).toHaveCount(0);
  await expect(page.getByTestId('weapon-row')).toHaveCount(0);
});

test('deleting a weapon removes its row', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill('Doomed');
  await page.getByTestId('weapon-save').click();
  await expect(page.getByTestId('weapon-row')).toHaveCount(1);

  await page.getByTestId('weapon-row').first().getByTestId('weapon-row-delete').click();
  await expect(page.getByTestId('weapon-row')).toHaveCount(0);
});

test('weapons persist across reload', async ({ page }) => {
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill('Persistent Pistol');
  await page.getByTestId('weapon-save').click();

  await page.reload();
  await page.getByTestId('dm-tab-weapons').click();
  await expect(page.getByTestId('weapon-row')).toHaveCount(1);
  await expect(page.getByTestId('weapon-row').first().getByTestId('weapon-row-name')).toHaveText(
    'Persistent Pistol'
  );
});

test('multiple weapons coexist in the list', async ({ page }) => {
  for (const name of ['Heavy Pistol', 'Assault Rifle', 'Katana']) {
    await page.getByTestId('weapon-add-button').click();
    await page.getByTestId('weapon-name-input').fill(name);
    if (name === 'Katana') await page.getByTestId('weapon-kind-melee').click();
    await page.getByTestId('weapon-save').click();
  }
  await expect(page.getByTestId('weapon-row')).toHaveCount(3);
});
