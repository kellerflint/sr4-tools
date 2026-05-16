import { describe, it, expect } from 'vitest';
import {
  initiativeBase,
  initiativePool,
  physicalTrackSize,
  stunTrackSize,
  woundModifier,
  isExhausted,
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

describe('pickNextActor', () => {
  it('picks the highest init score among those with passes left', () => {
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
    expect(pickNextActor(combatants, charactersById)).toBe('b');
  });

  it('skips exhausted combatants', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 1 })],
      ['c2', char({ id: 'c2', ipMax: 1 })],
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 12, passesActed: 1 }),
      comb({ id: 'b', characterId: 'c2', initScore: 5 }),
    ];
    expect(pickNextActor(combatants, charactersById)).toBe('b');
  });

  it('returns null when everyone is done', () => {
    const charactersById = new Map([['c1', char({ ipMax: 1 })]]);
    expect(
      pickNextActor([comb({ passesActed: 1 })], charactersById)
    ).toBeNull();
  });

  it('returns null on an empty roster', () => {
    expect(pickNextActor([], new Map())).toBeNull();
  });
});

describe('sortRoster', () => {
  it('places exhausted combatants below active ones', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 1 })],
      ['c2', char({ id: 'c2', ipMax: 1 })],
      ['c3', char({ id: 'c3', ipMax: 1 })],
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 5, passesActed: 1 }),
      comb({ id: 'b', characterId: 'c2', initScore: 3 }),
      comb({ id: 'c', characterId: 'c3', initScore: 10 }),
    ];
    const sorted = sortRoster(combatants, charactersById);
    expect(sorted.map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });

  it('orders active and exhausted groups each by init score desc', () => {
    const charactersById = new Map([
      ['c1', char({ id: 'c1', ipMax: 1 })],
      ['c2', char({ id: 'c2', ipMax: 1 })],
      ['c3', char({ id: 'c3', ipMax: 1 })],
      ['c4', char({ id: 'c4', ipMax: 1 })],
    ]);
    const combatants = [
      comb({ id: 'a', characterId: 'c1', initScore: 4, passesActed: 1 }), // done
      comb({ id: 'b', characterId: 'c2', initScore: 8 }),
      comb({ id: 'c', characterId: 'c3', initScore: 12, passesActed: 1 }), // done
      comb({ id: 'd', characterId: 'c4', initScore: 6 }),
    ];
    const sorted = sortRoster(combatants, charactersById);
    expect(sorted.map((c) => c.id)).toEqual(['b', 'd', 'c', 'a']);
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
