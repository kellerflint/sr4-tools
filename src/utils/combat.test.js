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
  autoAdvance,
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
  it('groups by category (ready → acted → done), init desc within each', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 1 })], // a → done (passesActed=1)
      ['c2', char({ id: 'c2', ipMax: 1 })], // b → ready (passesActed=0)
      ['c3', char({ id: 'c3', ipMax: 2 })], // c → acted (passesActed=1, has more)
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 5, passesActed: 1 }),
      comb({ id: 'b', characterId: 'c2', initScore: 3 }),
      comb({ id: 'c', characterId: 'c3', initScore: 10, passesActed: 1 }),
    ];
    expect(sortRoster(combatants, charactersById, 1).map((x) => x.id)).toEqual([
      'b', // ready (only one)
      'c', // acted
      'a', // done
    ]);
  });

  it('within a category, higher init goes first', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 2 })],
      ['c2', char({ id: 'c2', ipMax: 2 })],
      ['c3', char({ id: 'c3', ipMax: 2 })],
    ]);
    // All three ready: low/high/mid init → sorted high, mid, low
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 5 }),
      comb({ id: 'b', characterId: 'c2', initScore: 15 }),
      comb({ id: 'c', characterId: 'c3', initScore: 10 }),
    ];
    expect(sortRoster(combatants, charactersById, 1).map((x) => x.id)).toEqual([
      'b', 'c', 'a',
    ]);
  });
});

describe('autoAdvance', () => {
  it('returns state unchanged when someone is ready in current pass', () => {
    const charactersById = new Map([['c1', char({ id: 'c1', ipMax: 2 })]]);
    const combatants = [comb({ characterId: 'c1' })];
    const r = autoAdvance(combatants, charactersById, 1, 0);
    expect(r.currentPass).toBe(1);
    expect(r.combatTurn).toBe(0);
    expect(r.combatants).toBe(combatants);
  });

  it('bumps currentPass when nobody is ready but Cat 2 has someone', () => {
    // One combatant, ipMax 2, has already acted in pass 1. Cat 2 has them.
    const charactersById = new Map([['c1', char({ id: 'c1', ipMax: 2 })]]);
    const combatants = [comb({ characterId: 'c1', passesActed: 1 })];
    const r = autoAdvance(combatants, charactersById, 1, 0);
    expect(r.currentPass).toBe(2);
    expect(r.combatTurn).toBe(0);
    expect(r.combatants[0].passesActed).toBe(1); // unchanged
  });

  it('starts a new combat turn when Cat 1 and Cat 2 are both empty', () => {
    const charactersById = new Map([['c1', char({ id: 'c1', ipMax: 1 })]]);
    // Combatant is done (passesActed=ipMax). Cat 3 only.
    const combatants = [comb({ characterId: 'c1', passesActed: 1 })];
    const r = autoAdvance(combatants, charactersById, 1, 5);
    expect(r.combatTurn).toBe(6);
    expect(r.currentPass).toBe(1);
    expect(r.combatants[0].passesActed).toBe(0);
  });

  it('handles Joe/Bob mid-fight: Joe done, Bob acted-once — bumps to pass 2', () => {
    const charactersById = new Map([
      ['joe', char({ id: 'joe', ipMax: 1 })],
      ['bob', char({ id: 'bob', ipMax: 3 })],
    ]);
    const combatants = [
      comb({ characterId: 'joe', passesActed: 1 }), // done
      comb({ characterId: 'bob', passesActed: 1 }), // acted, has 2 more
    ];
    const r = autoAdvance(combatants, charactersById, 1, 0);
    expect(r.currentPass).toBe(2);
    expect(r.combatTurn).toBe(0);
    // Now Bob is Cat 1 again
    expect(
      combatantStatus(r.combatants[1], charactersById.get('bob'), r.currentPass)
    ).toBe('ready');
  });

  it('does nothing for an empty roster', () => {
    const r = autoAdvance([], new Map(), 1, 0);
    expect(r.currentPass).toBe(1);
    expect(r.combatTurn).toBe(0);
    expect(r.combatants).toEqual([]);
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
