import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/dm');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByTestId('dm-tab-characters').click();
});

// Helper — seed a weapon via the Weapons tab so attach tests have something
// to attach to.
async function addWeapon(page, name) {
  await page.getByTestId('dm-tab-weapons').click();
  await page.getByTestId('weapon-add-button').click();
  await page.getByTestId('weapon-name-input').fill(name);
  await page.getByTestId('weapon-save').click();
  await page.getByTestId('dm-tab-characters').click();
}

test('empty state shown when no characters exist', async ({ page }) => {
  await expect(page.getByTestId('character-row')).toHaveCount(0);
  await expect(page.getByTestId('character-add-button')).toBeVisible();
});

test('add button opens an empty form', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await expect(page.getByTestId('character-form')).toBeVisible();
  await expect(page.getByTestId('character-name-input')).toHaveValue('');
});

test('save is disabled until a name is entered', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await expect(page.getByTestId('character-save')).toBeDisabled();
  await page.getByTestId('character-name-input').fill('Sam');
  await expect(page.getByTestId('character-save')).toBeEnabled();
});

test('adding a character creates a row with the name visible', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Sam');
  await page.getByTestId('character-save').click();

  await expect(page.getByTestId('character-row')).toHaveCount(1);
  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-name')
  ).toHaveText('Sam');
});

test('default attributes show up in the row summary', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Sam');
  await page.getByTestId('character-save').click();

  const summary = page.getByTestId('character-row').first().getByTestId('character-row-summary');
  // Defaults: all attributes 3 → BOD 3 · AGI 3 · REA 3
  await expect(summary).toContainText('BOD 3');
  await expect(summary).toContainText('AGI 3');
});

test('adjusting an attribute changes the saved value', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Sam');
  // Bump AGI 3 → 5
  await page.getByTestId('character-attr-agi-inc').click();
  await page.getByTestId('character-attr-agi-inc').click();
  await page.getByTestId('character-save').click();

  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-summary')
  ).toContainText('AGI 5');
});

test('skills land in the summary', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Sam');
  // Firearms 0 → 5
  for (let i = 0; i < 5; i++) await page.getByTestId('character-skill-firearms-inc').click();
  await page.getByTestId('character-save').click();

  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-summary')
  ).toContainText('Firearms 5');
});

test('attribute steppers are clamped to the 1-9 range', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  // Default BOD = 3, push up to 9 (6 clicks)
  for (let i = 0; i < 6; i++) await page.getByTestId('character-attr-bod-inc').click();
  await expect(page.getByTestId('character-attr-bod-value')).toHaveValue('9');
  await expect(page.getByTestId('character-attr-bod-inc')).toBeDisabled();
  // Push down to 1
  for (let i = 0; i < 8; i++) await page.getByTestId('character-attr-bod-dec').click();
  await expect(page.getByTestId('character-attr-bod-value')).toHaveValue('1');
  await expect(page.getByTestId('character-attr-bod-dec')).toBeDisabled();
});

test('weapon attach: empty library shows hint', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await expect(page.getByTestId('character-weapon-attach')).toHaveCount(0);
  // Hint about the empty library
  await expect(page.getByTestId('character-form')).toContainText(
    'No weapons in the library yet'
  );
});

test('weapon attach: pick a weapon from the library', async ({ page }) => {
  await addWeapon(page, 'Heavy Pistol');
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Sam');

  await expect(page.getByTestId('weapon-attach-option')).toHaveCount(1);
  await page.getByTestId('weapon-attach-option').first().click();
  await expect(page.getByTestId('weapon-attach-option').first()).toHaveAttribute(
    'data-active',
    'true'
  );

  await page.getByTestId('character-save').click();

  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-summary')
  ).toContainText('Heavy Pistol');
});

test('weapon attach: toggle off removes from list', async ({ page }) => {
  await addWeapon(page, 'Katana');
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Mira');
  await page.getByTestId('weapon-attach-option').first().click();
  await page.getByTestId('weapon-attach-option').first().click(); // toggle off
  await page.getByTestId('character-save').click();

  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-summary')
  ).toContainText('No weapons attached');
});

test('editing a character preserves and updates values', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Sam');
  await page.getByTestId('character-save').click();

  await page.getByTestId('character-row').first().getByTestId('character-row-edit').click();
  await expect(page.getByTestId('character-name-input')).toHaveValue('Sam');
  // Bump Firearms to 4
  for (let i = 0; i < 4; i++) await page.getByTestId('character-skill-firearms-inc').click();
  await page.getByTestId('character-save').click();

  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-summary')
  ).toContainText('Firearms 4');
});

test('deleting a character removes its row', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Doomed');
  await page.getByTestId('character-save').click();
  await expect(page.getByTestId('character-row')).toHaveCount(1);

  await page.getByTestId('character-row').first().getByTestId('character-row-delete').click();
  await expect(page.getByTestId('character-row')).toHaveCount(0);
});

test('cancel discards the form', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Throwaway');
  await page.getByTestId('character-cancel').click();
  await expect(page.getByTestId('character-form')).toHaveCount(0);
  await expect(page.getByTestId('character-row')).toHaveCount(0);
});

test('characters persist across reload', async ({ page }) => {
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill('Persistent Sam');
  await page.getByTestId('character-save').click();

  await page.reload();
  await page.getByTestId('dm-tab-characters').click();
  await expect(page.getByTestId('character-row')).toHaveCount(1);
  await expect(
    page.getByTestId('character-row').first().getByTestId('character-row-name')
  ).toHaveText('Persistent Sam');
});
