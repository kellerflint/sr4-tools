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

test('Acted button increments the displayed IP counter across passes', async ({ page }) => {
  await addCharacter(page, 'Sam', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await expect(row).toContainText('IP 0/2');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 1/2');
  // Acted disabled until Next Pass
  await page.getByTestId('next-pass').click();
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 2/2');
});

test('Acted on a 1-IP combatant: done combatant drops below those still ready', async ({ page }) => {
  // Two 1-IP combatants, both init 0. Clicking Acted on row 0 marks them
  // 'done' for the turn; sortRoster moves them below the ready combatant.
  // This is the intentional behaviour — the next-to-act bubbles up.
  await addCharacter(page, 'Alice');
  await addCharacter(page, 'Bob');
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  await rows.nth(0).getByTestId('combatant-advance').click();

  // Row 0 is now the still-ready combatant (0/1). Row 1 is done (1/1).
  await expect(rows.nth(0)).toContainText('IP 0/1');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 1/1');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'done');
});

test('Acted on multi-IP combatant: acted-this-pass drops below still-ready', async ({ page }) => {
  // Two 2-IP combatants. After Acted on row 0, that combatant is 'acted'
  // and drops below the still-ready combatant — even though both have the
  // same init. Reorder is the desired feedback.
  await addCharacter(page, 'Alice', { ipMax: 2 });
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  await rows.nth(0).getByTestId('combatant-advance').click();

  // Row 0 = ready combatant (0/2). Row 1 = acted-this-pass combatant (1/2).
  await expect(rows.nth(0)).toContainText('IP 0/2');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 1/2');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'acted');
});

test('After Acted, the just-acted combatant drops below others still ready', async ({ page }) => {
  // Alice: init 10, 2 IPs. Bob: init 5, 1 IP.
  // Pass 1 starts. Alice (higher init) is at the top.
  // Click Acted on Alice. Alice acted this pass; Bob hasn't.
  // Even though Alice has higher init, Bob should now be the "next to act"
  // because Alice is waiting for Next Pass.
  await addCharacter(page, 'Alice', { ipMax: 2 });
  await addCharacter(page, 'Bob', { ipMax: 1 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  // Set inits — row 0 is Alice (added first), row 1 is Bob
  await rows.nth(0).getByTestId('combatant-init-value').fill('10');
  await rows.nth(0).getByTestId('combatant-init-value').blur();
  await rows.nth(1).getByTestId('combatant-init-value').fill('5');
  await rows.nth(1).getByTestId('combatant-init-value').blur();

  // Alice (init 10) should be on top
  await expect(rows.nth(0)).toContainText('IP 0/2');
  await expect(rows.nth(1)).toContainText('IP 0/1');

  await rows.nth(0).getByTestId('combatant-advance').click();

  // Bob (still ready, lower init) should now be on top.
  // Alice (acted this pass, has 1 more IP) drops to row 1.
  await expect(rows.nth(0)).toContainText('IP 0/1'); // Bob
  await expect(rows.nth(1)).toContainText('IP 1/2'); // Alice
});

test('Acted on a multi-IP combatant disables until Next Pass', async ({ page }) => {
  // ipMax = 2 character. After one Acted click, they have one pass left
  // (passesActed = 1, ipMax = 2). BUT they can't act AGAIN in the SAME
  // pass — they have to wait for Next Pass.
  await addCharacter(page, 'Sam', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await row.getByTestId('combatant-advance').click();
  // Already acted in this pass — Acted should be disabled
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();
  await expect(row).toContainText('IP 1/2');
});

test('Next Pass re-enables Acted for combatants with IPs left', async ({ page }) => {
  await addCharacter(page, 'Sam', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await row.getByTestId('combatant-advance').click();
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();

  await page.getByTestId('next-pass').click();

  // Now Sam can act again in pass 2
  await expect(row.getByTestId('combatant-advance')).toBeEnabled();
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 2/2');
  // No passes left — Acted now permanently disabled until New Combat Turn
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();
});

test('Next Pass does NOT re-enable Acted for combatants out of IPs', async ({ page }) => {
  await addCharacter(page, 'Sam'); // ipMax = 1
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await row.getByTestId('combatant-advance').click();
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();

  await page.getByTestId('next-pass').click();
  // Still disabled — Sam used his only IP
  await expect(row.getByTestId('combatant-advance')).toBeDisabled();
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

test('Multi-IP combatant cycles ready → acted → ready → done across two passes', async ({ page }) => {
  await addCharacter(page, 'Sam', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();

  const row = page.getByTestId('combatant-row').first();
  await expect(row).toHaveAttribute('data-status', 'ready');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-status', 'acted');
  await page.getByTestId('next-pass').click();
  await expect(row).toHaveAttribute('data-status', 'ready');
  await row.getByTestId('combatant-advance').click();
  await expect(row).toHaveAttribute('data-status', 'done');
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
