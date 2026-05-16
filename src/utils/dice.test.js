import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rollD6, rollPool, summarizeRolls } from './dice.js';

describe('summarizeRolls', () => {
  it('counts 5s and 6s as hits', () => {
    expect(summarizeRolls([1, 2, 3, 4, 5, 6], 6).hits).toBe(2);
  });

  it('counts ones independently of hits', () => {
    expect(summarizeRolls([1, 1, 5], 3).ones).toBe(2);
  });

  it('flags a glitch when half or more dice are 1s', () => {
    expect(summarizeRolls([1, 1, 5, 6], 4).isGlitch).toBe(true);
    expect(summarizeRolls([1, 1, 1, 5, 6], 5).isGlitch).toBe(true);
  });

  it('does not flag a glitch when fewer than half are 1s', () => {
    expect(summarizeRolls([1, 5, 6, 4], 4).isGlitch).toBe(false);
  });

  it('flags a critical glitch only when a glitch has zero hits', () => {
    expect(summarizeRolls([1, 1, 2, 3], 4).isCriticalGlitch).toBe(true);
    // glitch but with a hit → not critical
    expect(summarizeRolls([1, 1, 5, 2], 4).isCriticalGlitch).toBe(false);
    // hits with no glitch
    expect(summarizeRolls([1, 5, 6, 4], 4).isCriticalGlitch).toBe(false);
  });

  it('cannot glitch on an empty pool', () => {
    expect(summarizeRolls([], 0).isGlitch).toBe(false);
  });

  it('measures glitch against the original pool size, not post-explosion totals', () => {
    // Started with 4 dice, exploded to 6 results, but only 2 of the
    // original were 1s — not a glitch.
    expect(summarizeRolls([1, 1, 6, 5, 6, 4], 4).isGlitch).toBe(true);
    // Starting pool of 6 dice, only 2 are ones → no glitch even though
    // the rolls array later grows from exploded sixes.
    expect(summarizeRolls([1, 1, 6, 5, 6, 4, 3, 2], 6).isGlitch).toBe(false);
  });
});

describe('rollD6', () => {
  it('returns an integer between 1 and 6 inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const v = rollD6();
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('rollPool', () => {
  let randomSpy;

  afterEach(() => {
    if (randomSpy) randomSpy.mockRestore();
  });

  function seedRolls(values) {
    // Each Math.random() call produces (floor(random*6)+1). To force a
    // specific result v, return (v-1)/6 (any value in [(v-1)/6, v/6) works
    // but (v-1)/6 is safe).
    let i = 0;
    randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      const v = values[i % values.length];
      i++;
      return (v - 1) / 6;
    });
  }

  it('rolls the requested pool size', () => {
    seedRolls([3]); // anything non-special
    const r = rollPool(5);
    expect(r.rolls).toHaveLength(5);
  });

  it('returns zero-length rolls and no hits for a zero pool', () => {
    const r = rollPool(0);
    expect(r.rolls).toEqual([]);
    expect(r.hits).toBe(0);
  });

  it('floors and clamps negative pool sizes to zero', () => {
    expect(rollPool(-3).rolls).toEqual([]);
    expect(rollPool(2.9).rolls).toHaveLength(2);
  });

  it('does not explode sixes by default', () => {
    seedRolls([6, 6, 6, 3]);
    const r = rollPool(3);
    expect(r.rolls).toEqual([6, 6, 6]);
    expect(r.hits).toBe(3);
  });

  it('explodes sixes when ruleOfSix is set', () => {
    // 3 dice: two 6s, one 3. The two 6s re-roll → 6 and 2.
    // The new 6 re-rolls → 4. Then no more 6s.
    seedRolls([6, 6, 3, 6, 2, 4]);
    const r = rollPool(3, { ruleOfSix: true });
    // Rolls grew: [6,6,3] + [6,2] + [4] → 6 dice total
    expect(r.rolls).toEqual([6, 6, 3, 6, 2, 4]);
    expect(r.hits).toBe(3); // three 6s, no 5s
  });
});
