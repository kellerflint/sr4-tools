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

test('Solo combatant cycles forever via auto-pass and auto-turn advance', async ({ page }) => {
  // With no one else in the roster, each Acted click auto-advances the
  // pass; the final Acted of the turn auto-advances the combat turn and
  // resets the combatant's IP. They stay ready, perpetually.
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
  // Third click exhausts pass 3 → auto-advance combat turn → reset to IP 3/3
  await row.getByTestId('combatant-advance').click();
  await expect(row).toContainText('IP 3/3');
  await expect(row).toHaveAttribute('data-status', 'ready');
  await expect(page.getByTestId('combat-turn')).toContainText('Combat turn 1');
});

test('Joe (IP 1, INIT 10) and Bob (IP 3, INIT 5) follow SR4 pass + turn cascade', async ({ page }) => {
  // Three categories: ready (Cat 1) → acted (Cat 2) → done (Cat 3).
  // Joe (1 IP, 10) and Bob (3 IP, 5). Walkthrough:
  //   pass 1: Joe acts → done. Bob still ready.
  //   pass 1: Bob acts → no ready left, Bob has more IPs → auto-bump to pass 2.
  //   pass 2: Bob acts → bump to pass 3.
  //   pass 3: Bob acts → everyone done, auto-bump combat turn → all reset.
  await addCharacter(page, 'Joe');           // ipMax 1
  await addCharacter(page, 'Bob', { ipMax: 3 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  // Roster is in insertion order (init 0 ties). Set inits: Joe 10, Bob 5.
  await rows.nth(0).getByTestId('combatant-init-value').fill('10');
  await rows.nth(0).getByTestId('combatant-init-value').blur();
  await rows.nth(1).getByTestId('combatant-init-value').fill('5');
  await rows.nth(1).getByTestId('combatant-init-value').blur();

  // Both Cat 1. Joe at top.
  await expect(rows.nth(0)).toContainText('IP 1/1');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 3/3');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'ready');

  // Joe acts → Joe drops to Cat 3, Bob now alone at top of Cat 1.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 3/3'); // Bob bubbled up
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 0/1'); // Joe at bottom
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'done');

  // Bob acts pass 1 → auto-advance to pass 2, Bob still ready.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 2/3');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(page.getByTestId('current-pass')).toContainText('Pass 2');

  // Bob acts pass 2 → auto-advance to pass 3.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 1/3');
  await expect(page.getByTestId('current-pass')).toContainText('Pass 3');

  // Bob acts pass 3 → everyone done, auto-advance combat turn.
  // All passesActed reset to 0; pass back to 1; combatTurn bumped.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(0)).toContainText('IP 1/1'); // Joe is now at top (init 10) with passes reset
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 3/3');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'ready');
  await expect(page.getByTestId('current-pass')).toContainText('Pass 1');
  await expect(page.getByTestId('combat-turn')).toContainText('Combat turn 1');
});

test('Acted on multi-IP combatant: moves to Cat 2 (drops below still-ready)', async ({ page }) => {
  // Two 2-IP combatants. After Acted on row 0, that combatant is Cat 2
  // (acted-this-pass) and sorts below the still-ready Cat 1 combatant.
  await addCharacter(page, 'Alice', { ipMax: 2 });
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  await rows.nth(0).getByTestId('combatant-advance').click();

  // Row 0 = still-ready combatant (2/2). Row 1 = acted-this-pass (1/2).
  await expect(rows.nth(0)).toContainText('IP 2/2');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toContainText('IP 1/2');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'acted');
  await expect(rows.nth(1).getByTestId('combatant-advance')).toBeDisabled();
});

test('After everyone in pass 1 acts, auto-advance re-enables Cat 2 combatants', async ({ page }) => {
  await addCharacter(page, 'Alice', { ipMax: 2 });
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();

  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  await rows.nth(0).getByTestId('combatant-advance').click();
  await rows.nth(0).getByTestId('combatant-advance').click(); // top is the new ready one

  // Both have acted in pass 1. Auto-advance to pass 2 → both ready again.
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'ready');
  await expect(page.getByTestId('current-pass')).toContainText('Pass 2');
});

test('A combatant out of IPs shows as done when others can still act', async ({ page }) => {
  // We need a second combatant so that the auto-cascade stops at Cat 2 /
  // "next pass" rather than rolling into a new combat turn that would
  // reset the done combatant back to ready.
  await addCharacter(page, 'Joe'); // ipMax 1
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  // Joe (row 0) acts → Joe done, Bob still ready, no auto-turn.
  await rows.nth(0).getByTestId('combatant-advance').click();

  // Bob bubbles to row 0 (ready), Joe drops to row 1 (done, disabled).
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'done');
  await expect(rows.nth(1).getByTestId('combatant-advance')).toBeDisabled();
});

test('New Combat Turn manually resets everyone (works even mid-pass)', async ({ page }) => {
  // Two combatants so the auto-turn-advance doesn't fire when one acts.
  await addCharacter(page, 'Joe'); // ipMax 1
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  // Joe acts → he's done, Bob still ready.
  await rows.nth(0).getByTestId('combatant-advance').click();
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'done');

  // Manual New Turn — everyone resets to ready, combat-turn counter ticks.
  await page.getByTestId('new-combat-turn').click();
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
  await expect(rows.nth(1)).toHaveAttribute('data-status', 'ready');
  await expect(page.getByTestId('combat-turn')).toContainText('Combat turn 1');
});

test('New Combat Turn preserves initiative scores', async ({ page }) => {
  await addCharacter(page, 'Joe');
  await addCharacter(page, 'Bob', { ipMax: 2 });
  await page.getByTestId('dm-tab-combat').click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').first().click();
  await page.getByTestId('add-combatant-button').click();
  await page.getByTestId('add-combatant-option').nth(1).click();

  const rows = page.getByTestId('combatant-row');
  const joeInit = rows.nth(0).getByTestId('combatant-init-value');
  await joeInit.fill('15');
  await joeInit.blur();

  await rows.nth(0).getByTestId('combatant-advance').click(); // Joe acts → done
  await page.getByTestId('new-combat-turn').click();

  // Joe back at the top (init 15 wins) with passes reset and init preserved.
  await expect(rows.nth(0).getByTestId('combatant-init-value')).toHaveValue('15');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'ready');
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
