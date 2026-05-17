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

test('Initial IP display counts down from ipMax', async ({ page }) => {
  await addCharacter(page, 'Sam', { ipMax: 3 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await expect(page.getByTestId('combatant-row').first()).toContainText('IP 3/3');
});

test('Solo multi-IP combatant can click Acted ipMax times in a row (auto-advance)', async ({ page }) => {
  // With no one else to compete for the pass, the system should auto-
  // advance after each Acted, leaving the combatant immediately eligible
  // again until they exhaust their IPs.
  await addCharacter(page, 'Sam', { ipMax: 3 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await expect(row).toContainText('IP 3/3');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 2/3');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 1/3');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 0/3');
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();
});

test('Joe (IP 1, INIT 10) and Bob (IP 3, INIT 5) follow SR4 pass order', async ({ page }) => {
  // The exact walkthrough from the design discussion:
  //   Pass 1: Joe → Bob (Joe higher init, both eligible)
  //   Pass 2: Bob (Joe out of IP)
  //   Pass 3: Bob
  // Total acts in order: Joe, Bob, Bob, Bob.
  await addCharacter(page, 'Joe');           // ipMax 1
  await addCharacter(page, 'Bob', { ipMax: 3 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  // Set inits: row 0 (Joe) = 10, row 1 (Bob) = 5
  await rows.nth(0).getByTestId('combatant-init-value').fill('10');
  await rows.nth(0).getByTestId('combatant-init-value').blur();
  await rows.nth(1).getByTestId('combatant-init-value').fill('5');
  await rows.nth(1).getByTestId('combatant-init-value').blur();

  // Joe (init 10) at top with 1/1 IP, Bob below with 3/3 IP
  await expect(rows.nth(0)).toContainText('IP 1/1');
  await expect(rows.nth(1)).toContainText('IP 3/3');

  // Pass 1, step 1: Joe acts
  await rows.nth(0).getByTestId('combatant-advance').click();
  // Joe is now done (0/1). Bob still ready (3/3). Bob bubbles to top.
  await expect(rows.nth(0)).toContainText('IP 3/3');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 0/1');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'done');

  // Pass 1, step 2: Bob acts. Auto-advance to pass 2 (Joe is done, Bob
  // can act in pass 2 too — still eligible).
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 2/3');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');

  // Pass 2: Bob acts. Auto-advance to pass 3.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 1/3');

  // Pass 3: Bob acts (still at row 0 — only one ready). Combat turn over.
  // Both done now; Joe (higher init) wins the tiebreak so he sorts on top.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 0/1'); // Joe
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'done');
  await expect(rows.nth(1)).toContainText('IP 0/3'); // Bob
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'done');
});

test('Acted on multi-IP combatant: acted-this-pass drops below still-ready', async ({ page }) => {
  // Two 2-IP combatants. After Acted on row 0, that combatant is 'acted'
  // and drops below the still-ready combatant. No auto-advance because
  // the other combatant is still eligible in pass 1.
  await addCharacter(page, 'Alice', { ipMax: 2 });
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  await rows.nth(0).getByTestId('combatant-advance').click();

  // Row 0 = ready combatant (2/2). Row 1 = acted-this-pass (1/2, grayed).
  await expect(rows.nth(0)).toContainText('IP 2/2');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 1/2');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'acted');
});

test('After everyone in pass 1 acts, auto-advance reopens multi-IP combatants', async ({ page }) => {
  await addCharacter(page, 'Alice', { ipMax: 2 });
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  await rows.nth(0).getByTestId('combatant-advance').click();
  await rows.nth(0).getByTestId('combatant-advance').click(); // act on the new top

  // Both have now acted once. Auto-advance to pass 2 → both ready again.
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'ready');
});

test('Acted button consumes a pass and grays out the row when exhausted', async ({ page }) => {
  await addCharacter(page, 'Sam'); // default IP 1
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await expect(row).toHaveAttribute('data-status', 'ready');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-status', 'done');
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();
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
