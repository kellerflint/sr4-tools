import { describe, it, expect } from 'vitest';
import {
  initiativeBase,
  initiativePool,
  physicalTrackSize,
  stunTrackSize,
  woundModifier,
  isExhausted,
  combatantStatus,
  canActNow,
  pickNextActor,
  sortRoster,
  buildCombatantSuffixes,
} from './combat.js';

const char = (overrides = {}) => ({
  id: overrides.id || 'c1',
  name: overrides.name || 'Test',
  attributes: {
    bod: 4, agi: 4, rea: 4, str: 3, int: 4, log: 3, wil: 4, cha: 3, edg: 3,
    ...(overrides.attributes || {}),
  },
  ipMax: overrides.ipMax || 1,
  ...overrides,
});

const comb = (overrides = {}) => ({
  id: overrides.id || 'cb1',
  characterId: overrides.characterId || 'c1',
  initScore: overrides.initScore ?? 0,
  passesActed: overrides.passesActed || 0,
  currentPhysical: overrides.currentPhysical || 0,
  currentStun: overrides.currentStun || 0,
});

describe('initiative scores', () => {
  it('initiativeBase = REA + INT', () => {
    expect(initiativeBase(char({ attributes: { rea: 5, int: 6 } }))).toBe(11);
  });

  it('initiativePool = REA + INT', () => {
    expect(initiativePool(char({ attributes: { rea: 3, int: 2 } }))).toBe(5);
  });
});

describe('track sizes', () => {
  it('physical = 8 + ceil(BOD / 2)', () => {
    expect(physicalTrackSize(char({ attributes: { bod: 4 } }))).toBe(10);
    expect(physicalTrackSize(char({ attributes: { bod: 5 } }))).toBe(11);
    expect(physicalTrackSize(char({ attributes: { bod: 1 } }))).toBe(9);
  });

  it('stun = 8 + ceil(WIL / 2)', () => {
    expect(stunTrackSize(char({ attributes: { wil: 4 } }))).toBe(10);
    expect(stunTrackSize(char({ attributes: { wil: 3 } }))).toBe(10);
    expect(stunTrackSize(char({ attributes: { wil: 1 } }))).toBe(9);
  });
});

describe('woundModifier', () => {
  it('is 0 for a fresh combatant', () => {
    expect(woundModifier(comb())).toBe(0);
  });

  it('is −1 once any track hits 3 boxes', () => {
    expect(woundModifier(comb({ currentPhysical: 3 }))).toBe(-1);
    expect(woundModifier(comb({ currentStun: 3 }))).toBe(-1);
  });

  it('stacks across tracks', () => {
    expect(woundModifier(comb({ currentPhysical: 3, currentStun: 3 }))).toBe(-2);
    expect(woundModifier(comb({ currentPhysical: 6, currentStun: 3 }))).toBe(-3);
  });

  it('uses floor (2 boxes = no penalty yet)', () => {
    expect(woundModifier(comb({ currentPhysical: 2 }))).toBe(0);
  });
});

describe('isExhausted', () => {
  it('returns true when passesActed >= ipMax', () => {
    expect(isExhausted(comb({ passesActed: 1 }), char({ ipMax: 1 }))).toBe(true);
    expect(isExhausted(comb({ passesActed: 2 }), char({ ipMax: 2 }))).toBe(true);
  });

  it('returns false when passes remain', () => {
    expect(isExhausted(comb({ passesActed: 0 }), char({ ipMax: 1 }))).toBe(false);
    expect(isExhausted(comb({ passesActed: 1 }), char({ ipMax: 3 }))).toBe(false);
  });

  it('returns true when character is missing', () => {
    expect(isExhausted(comb(), undefined)).toBe(true);
  });
});

describe('combatantStatus', () => {
  it("is 'ready' when passesActed < currentPass and IPs remain", () => {
    // Fresh combatant in pass 1: passesActed 0 < currentPass 1, ipMax 2 → ready
    expect(
      combatantStatus(comb({ passesActed: 0 }), char({ ipMax: 2 }), 1)
    ).toBe('ready');
  });

  it("is 'acted' when combatant used their pass-1 slot but still has IPs", () => {
    expect(
      combatantStatus(comb({ passesActed: 1 }), char({ ipMax: 2 }), 1)
    ).toBe('acted');
  });

  it("is 'ready' again in pass 2 for a multi-IP combatant that acted in pass 1", () => {
    expect(
      combatantStatus(comb({ passesActed: 1 }), char({ ipMax: 2 }), 2)
    ).toBe('ready');
  });

  it("is 'done' when passesActed >= ipMax regardless of pass", () => {
    expect(
      combatantStatus(comb({ passesActed: 1 }), char({ ipMax: 1 }), 1)
    ).toBe('done');
    expect(
      combatantStatus(comb({ passesActed: 2 }), char({ ipMax: 2 }), 5)
    ).toBe('done');
  });

  it("is 'done' when the character has been removed", () => {
    expect(combatantStatus(comb(), undefined, 1)).toBe('done');
  });
});

describe('canActNow', () => {
  it('is true only when status is ready', () => {
    expect(canActNow(comb({ passesActed: 0 }), char({ ipMax: 2 }), 1)).toBe(true);
    expect(canActNow(comb({ passesActed: 1 }), char({ ipMax: 2 }), 1)).toBe(false);
    expect(canActNow(comb({ passesActed: 1 }), char({ ipMax: 1 }), 1)).toBe(false);
  });
});

describe('pickNextActor', () => {
  it('picks the highest init score among ready combatants in pass 1', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 1 })],
      ['c2', char({ id: 'c2', ipMax: 1 })],
      ['c3', char({ id: 'c3', ipMax: 1 })],
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 7 }),
      comb({ id: 'b', characterId: 'c2', initScore: 12 }),
      comb({ id: 'c', characterId: 'c3', initScore: 4 }),
    ];
    expect(pickNextActor(combatants, charactersById, 1)).toBe('b');
  });

  it('skips combatants that have already acted in this pass', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 2 })], // multi-IP
      ['c2', char({ id: 'c2', ipMax: 1 })],
    ]);
    const combatants = [
      // Acted once already in pass 1 — has more IPs but not for this pass
      comb({ id: 'a', characterId: 'c1', initScore: 12, passesActed: 1 }),
      comb({ id: 'b', characterId: 'c2', initScore: 5 }),
    ];
    expect(pickNextActor(combatants, charactersById, 1)).toBe('b');
  });

  it('returns to the multi-IP combatant in pass 2', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 2 })],
      ['c2', char({ id: 'c2', ipMax: 1 })],
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 12, passesActed: 1 }),
      comb({ id: 'b', characterId: 'c2', initScore: 5, passesActed: 1 }),
    ];
    // Pass 2: only a is eligible (c2/Bob is out of IPs)
    expect(pickNextActor(combatants, charactersById, 2)).toBe('a');
  });

  it('returns null when nobody can act this pass', () => {
    const charactersById = new Map([['c1', char({ ipMax: 1 })]]);
    expect(
      pickNextActor([comb({ passesActed: 1 })], charactersById, 1)
    ).toBeNull();
  });

  it('returns null on an empty roster', () => {
    expect(pickNextActor([], new Map(), 1)).toBeNull();
  });
});

describe('sortRoster', () => {
  it('orders ready combatants by init desc, then acted, then done', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 1 })], // a: done after 1 pass
      ['c2', char({ id: 'c2', ipMax: 1 })], // b: ready
      ['c3', char({ id: 'c3', ipMax: 2 })], // c: acted this pass, has more
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 5, passesActed: 1 }), // done
      comb({ id: 'b', characterId: 'c2', initScore: 3 }),                  // ready
      comb({ id: 'c', characterId: 'c3', initScore: 10, passesActed: 1 }), // acted
    ];
    // Ready first (b), then acted (c), then done (a)
    expect(sortRoster(combatants, charactersById, 1).map((c) => c.id)).toEqual([
      'b', 'c', 'a',
    ]);
  });

  it('after Acted on the top combatant, others still ready bubble up', () => {
    // The bug the user reported: Alice (init 10, 2 IPs) and Bob (init 5, 1 IP).
    // Before Acted, order is Alice, Bob (both ready). After Acted on Alice,
    // Bob (still ready) takes the top spot; Alice (acted this pass) drops.
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 2 })], // Alice
      ['c2', char({ id: 'c2', ipMax: 1 })], // Bob
    ]);
    const before = [
      comb({ id: 'a', characterId: 'c1', initScore: 10 }),
      comb({ id: 'b', characterId: 'c2', initScore: 5 }),
    ];
    expect(sortRoster(before, charactersById, 1).map((c) => c.id)).toEqual([
      'a', 'b',
    ]);
    const after = [
      { ...before[0], passesActed: 1 }, // Alice acted
      before[1],
    ];
    expect(sortRoster(after, charactersById, 1).map((c) => c.id)).toEqual([
      'b', 'a',
    ]);
  });

  it('higher-IP combatant bubbles up once everyone else is done', () => {
    // Alice 4 IPs init 15, Bob 2 IPs init 18. Pass 3: Bob is done (used
    // both his passes), Alice still has 2 more.
    const charactersById = new Map([
      ['alice', char({ id: 'alice', ipMax: 4 })],
      ['bob', char({ id: 'bob', ipMax: 2 })],
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'alice', initScore: 15, passesActed: 2 }),
      comb({ id: 'b', characterId: 'bob', initScore: 18, passesActed: 2 }),
    ];
    expect(sortRoster(combatants, charactersById, 3).map((c) => c.id)).toEqual([
      'a', // ready in pass 3
      'b', // done
    ]);
  });
});

describe('buildCombatantSuffixes', () => {
  it('returns empty suffix for unique characters', () => {
    const m = buildCombatantSuffixes([
      comb({ id: 'a', characterId: 'c1' }),
      comb({ id: 'b', characterId: 'c2' }),
    ]);
    expect(m.get('a')).toBe('');
    expect(m.get('b')).toBe('');
  });

  it('numbers duplicates of the same characterId', () => {
    const m = buildCombatantSuffixes([
      comb({ id: 'a', characterId: 'c1' }),
      comb({ id: 'b', characterId: 'c1' }),
      comb({ id: 'c', characterId: 'c1' }),
    ]);
    expect(m.get('a')).toBe(' #1');
    expect(m.get('b')).toBe(' #2');
    expect(m.get('c')).toBe(' #3');
  });

  it('mixes unique and duplicate characters correctly', () => {
    const m = buildCombatantSuffixes([
      comb({ id: 'a', characterId: 'c1' }),
      comb({ id: 'b', characterId: 'c2' }),
      comb({ id: 'c', characterId: 'c1' }),
    ]);
    expect(m.get('a')).toBe(' #1');
    expect(m.get('b')).toBe('');
    expect(m.get('c')).toBe(' #2');
  });
});
