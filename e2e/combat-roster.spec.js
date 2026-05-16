import { test, expect } from '@playwright/test';

// Helper: seed a character in the library via the Characters tab.
// Adjusts attributes by clicking inc/dec the right number of times.
async function addCharacter(page, name, attrs = {}) {
  await page.getByTestId('dm-tab-characters').click();
  await page.getByTestId('character-add-button').click();
  await page.getByTestId('character-name-input').fill(name);

  const adjustAttr = async (id, target, current = 3) => {
    const delta = target - current;
    const testId = delta > 0 ? `character-attr-${id}-inc` : `character-attr-${id}-dec`;
    for (let i = 0; i < Math.abs(delta); i++) {
      await page.getByTestId(testId).click();
    }
  };

  if (attrs.rea != null) await adjustAttr('rea', attrs.rea);
  if (attrs.int != null) await adjustAttr('int', attrs.int);
  if (attrs.bod != null) await adjustAttr('bod', attrs.bod);
  if (attrs.ipMax != null && attrs.ipMax > 1) {
    for (let i = 1; i < attrs.ipMax; i++) {
      await page.getByTestId('character-ip-inc').click();
    }
  }

  await page.getByTestId('character-save').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/dm');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('Combat tab loads with an empty roster message', async ({ page }) => {
  await expect(page.getByTestId('dm-roster')).toBeVisible();
  await expect(page.getByTestId('combatant-row')).toHaveCount(0);
  await expect(page.getByTestId('add-combatant-button')).toBeVisible();
});

test('Add Combatant picker shows a hint when the library is empty', async ({ page }) => {
  await page.getByTestId('add-combatant-button').click();
  await expect(page.getByTestId('add-combatant-picker')).toBeVisible();
  await expect(page.getByTestId('add-combatant-picker')).toContainText(
    'No characters in the library yet'
  );
});

test('Add a character from the library to the combat roster', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await expect(page.getByTestId('add-combatant-option')).toHaveCount(1);
  await page.getByTestId('add-combatant-option').first().click();

  await expect(page.getByTestId('combatant-row')).toHaveCount(1);
  await expect(page.getByTestId('combatant-name').first()).toHaveText('Sam');
});

test('Adding the same character twice numbers the duplicates', async ({ page }) => {
  await addCharacter(page, 'Goon');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const names = await page.getByTestId('combatant-name').allTextContents();
  expect(names).toEqual(['Goon #1', 'Goon #2']);
});

test('Removing a combatant takes them off the roster', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await expect(page.getByTestId('combatant-row')).toHaveCount(1);

  await page.getByTestId('combatant-row').first().getByTestId('combatant-remove').click();
  await expect(page.getByTestId('combatant-row')).toHaveCount(0);
});

test('Manual init entry stores the typed value', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const initInput = page
    .getByTestId('combatant-row')
    .first()
    .getByTestId('combatant-init-value');
  await initInput.fill('12');
  await initInput.blur();
  await expect(initInput).toHaveValue('12');
});

test('Roll All Initiative sets a score of at least REA + INT', async ({ page }) => {
  await addCharacter(page, 'Sam', { rea: 4, int: 4 }); // base 8
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  await page.getByTestId('roll-all-initiative').click();
  const score = await page
    .getByTestId('combatant-row')
    .first()
    .getByTestId('combatant-init-value')
    .inputValue();
  expect(Number(score)).toBeGreaterThanOrEqual(8);
});

test('Acted button consumes a pass and grays out the row when exhausted', async ({ page }) => {
  await addCharacter(page, 'Sam'); // default IP 1
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await expect(row).toHaveAttribute('data-exhausted', 'false');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-exhausted', 'true');
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();
});

test('Combatants with more IPs survive their first Acted click', async ({ page }) => {
  await addCharacter(page, 'Sam', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-exhausted', 'false');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-exhausted', 'true');
});

test('New Combat Turn resets passes (everyone can act again)', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-exhausted', 'true');

  await page.getByTestId('new-combat-turn').click();
  await expect(row).toHaveAttribute('data-exhausted', 'false');
  await expect(page.getByTestId('combat-turn')).toContainText('Combat turn 1');
});

test('New Combat Turn preserves initiative scores', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  const initInput = row.getByTestId('combatant-init-value');

  // Set init manually
  await initInput.fill('15');
  await initInput.blur();
  await expect(initInput).toHaveValue('15');

  // Use the pass
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-exhausted', 'true');

  // New combat turn — passes should reset, init should stay
  await page.getByTestId('new-combat-turn').click();
  await expect(row).toHaveAttribute('data-exhausted', 'false');
  await expect(initInput).toHaveValue('15');
});

test('Health adjustments apply wound modifier badge', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  // Default BOD 3 → physical track size 8 + 2 = 10. Click +3 boxes.
  await row.getByTestId('combatant-phys-inc').click();
  await row.getByTestId('combatant-phys-inc').click();
  await row.getByTestId('combatant-phys-inc').click();
  await expect(row.getByTestId('combatant-wound-mod')).toContainText('-1');
});

test('Combat state persists across reload', async ({ page }) => {
  await addCharacter(page, 'Sam');
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  await page.reload();
  await expect(page.getByTestId('combatant-row')).toHaveCount(1);
  await expect(page.getByTestId('combatant-name').first()).toHaveText('Sam');
});
