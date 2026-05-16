import { describe, it, expect } from 'vitest';
import {
  effectiveNetHits,
  buildBreakdown,
  buildDamage,
} from './useShootingState.js';
import { RANGES } from '../data/ranges.js';

// Minimal stat block — every test starts from this and overrides as needed.
const baseStats = {
  agility: 4,
  firearmsSkill: 4,
  smartlink: false,
  laserSight: false,
  recoilComp: 0,
  edge: 3,
  physicalDamage: 0,
  stunDamage: 0,
  weaponName: 'Heavy Pistol',
  baseDV: 5,
  baseAP: 0,
  damageType: 'P',
};

const baseShot = {
  rangeId: 'short',
  firingModeId: 'ss',
  faRounds: 6,
  modifiers: {},
  customMod: { label: '', mod: 0 },
  aimActions: 0,
  edgeMode: 'none',
  edgeSpend: 0,
  ammoId: 'regular',
  netHitsMode: 'direct',
  netHits: 0,
  yourHits: 0,
  defenderHits: 0,
};

describe('effectiveNetHits', () => {
  it('returns the typed-in value in direct mode', () => {
    expect(effectiveNetHits({ ...baseShot, netHits: 3 })).toBe(3);
  });

  it('clamps negative direct entries to zero', () => {
    expect(effectiveNetHits({ ...baseShot, netHits: -2 })).toBe(0);
  });

  it('computes max(0, yourHits - defenderHits) in compute mode', () => {
    expect(
      effectiveNetHits({
        ...baseShot,
        netHitsMode: 'compute',
        yourHits: 5,
        defenderHits: 2,
      })
    ).toBe(3);
  });

  it('returns 0 when defender beats attacker in compute mode', () => {
    expect(
      effectiveNetHits({
        ...baseShot,
        netHitsMode: 'compute',
        yourHits: 1,
        defenderHits: 4,
      })
    ).toBe(0);
  });
});

describe('buildBreakdown', () => {
  it('sums Agility + Firearms for a clean short-range single shot', () => {
    const b = buildBreakdown(baseStats, baseShot, 0, RANGES);
    // Short range = 0, SS = no recoil, no toggles → dice pool = AGI + FIR
    expect(b.dicePool).toBe(8);
  });

  it('applies the range penalty for medium range (−1)', () => {
    const b = buildBreakdown(
      { ...baseStats },
      { ...baseShot, rangeId: 'medium' },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(7);
  });

  it('applies the range penalty for extreme range (−6)', () => {
    const b = buildBreakdown(
      { ...baseStats },
      { ...baseShot, rangeId: 'extreme' },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(2);
  });

  it('subtracts uncompensated recoil', () => {
    // Burst fire = 2 recoil, RC 0 → −2 dice
    const b = buildBreakdown(
      baseStats,
      { ...baseShot, firingModeId: 'bf-narrow' },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(6);
  });

  it('cancels recoil one-for-one with recoil compensation', () => {
    // Burst fire = 2 recoil, RC 2 → no penalty
    const b = buildBreakdown(
      { ...baseStats, recoilComp: 2 },
      { ...baseShot, firingModeId: 'bf-narrow' },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(8);
    // No recoil line should appear when fully compensated
    expect(b.lines.find((l) => l.label.startsWith('Recoil'))).toBeUndefined();
  });

  it('does not over-compensate (RC greater than recoil gives no bonus dice)', () => {
    const b = buildBreakdown(
      { ...baseStats, recoilComp: 5 },
      { ...baseShot, firingModeId: 'bf-narrow' },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(8);
  });

  it('adds +2 for smartlink and +1 for laser sight', () => {
    const b = buildBreakdown(
      { ...baseStats, smartlink: true, laserSight: true },
      baseShot,
      0,
      RANGES
    );
    expect(b.dicePool).toBe(8 + 2 + 1);
  });

  it('adds +1 dice per aim action', () => {
    const b = buildBreakdown(baseStats, { ...baseShot, aimActions: 3 }, 0, RANGES);
    expect(b.dicePool).toBe(11);
  });

  it('applies an exclusive modifier from a group', () => {
    // good cover (1/2) = −4
    const b = buildBreakdown(
      baseStats,
      { ...baseShot, modifiers: { cover: 'cov-good' } },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(4);
  });

  it('applies independent (non-exclusive) modifiers additively', () => {
    // called shot = −4, multi-target = −2 → total −6
    const b = buildBreakdown(
      baseStats,
      {
        ...baseShot,
        modifiers: { 'called-shot': true, 'multi-target': true },
      },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(2);
  });

  it('subtracts the wound modifier', () => {
    const b = buildBreakdown(baseStats, baseShot, -2, RANGES);
    expect(b.dicePool).toBe(6);
  });

  it('clamps the dice pool to zero — never goes negative', () => {
    const b = buildBreakdown(
      { ...baseStats, agility: 1, firearmsSkill: 1 },
      { ...baseShot, rangeId: 'extreme' }, // −6 alone is enough
      -2,
      RANGES
    );
    expect(b.dicePool).toBe(0);
  });

  it('includes a non-zero custom modifier with the user-typed label', () => {
    const b = buildBreakdown(
      baseStats,
      { ...baseShot, customMod: { label: 'GM ruling', mod: -1 } },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(7);
    expect(b.lines.find((l) => l.label === 'GM ruling').value).toBe(-1);
  });

  it('does not include a custom modifier with value 0', () => {
    const b = buildBreakdown(
      baseStats,
      { ...baseShot, customMod: { label: 'noop', mod: 0 } },
      0,
      RANGES
    );
    expect(b.lines.find((l) => l.label === 'noop')).toBeUndefined();
  });

  it('adds Edge dice when in add mode', () => {
    const b = buildBreakdown(
      baseStats,
      { ...baseShot, edgeMode: 'add', edgeSpend: 2 },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(10);
  });

  it('adds Edge dice when in pushTheLimit mode (Rule of Six is separate)', () => {
    const b = buildBreakdown(
      baseStats,
      { ...baseShot, edgeMode: 'pushTheLimit', edgeSpend: 3 },
      0,
      RANGES
    );
    expect(b.dicePool).toBe(11);
  });
});

describe('buildDamage', () => {
  it('starts from the weapon base DV and damage type', () => {
    const d = buildDamage(baseStats, baseShot);
    expect(d.dv).toBe(5);
    expect(d.type).toBe('P');
    expect(d.ap).toBe(0);
  });

  it('adds the firing-mode bonus (narrow burst = +2 for BF)', () => {
    const d = buildDamage(baseStats, { ...baseShot, firingModeId: 'bf-narrow' });
    expect(d.dv).toBe(5 + 2);
  });

  it('adds +1 DV for SA-burst (one extra round)', () => {
    const d = buildDamage(baseStats, { ...baseShot, firingModeId: 'sa-burst' });
    expect(d.dv).toBe(5 + 1);
  });

  it('adds +9 DV for narrow full-auto (10 rounds, 9 extras)', () => {
    const d = buildDamage(baseStats, { ...baseShot, firingModeId: 'fa-narrow' });
    expect(d.dv).toBe(5 + 9);
  });

  it('does not add a DV bonus for wide-spread bursts', () => {
    const d = buildDamage(baseStats, { ...baseShot, firingModeId: 'bf-wide' });
    expect(d.dv).toBe(5);
  });

  it('adds net hits to DV when in direct mode', () => {
    const d = buildDamage(baseStats, { ...baseShot, netHits: 4 });
    expect(d.dv).toBe(5 + 4);
  });

  it('adds net hits to DV when in compute mode', () => {
    const d = buildDamage(baseStats, {
      ...baseShot,
      netHitsMode: 'compute',
      yourHits: 6,
      defenderHits: 2,
    });
    expect(d.dv).toBe(5 + 4);
  });

  it('treats negative compute-mode net hits as zero', () => {
    const d = buildDamage(baseStats, {
      ...baseShot,
      netHitsMode: 'compute',
      yourHits: 1,
      defenderHits: 5,
    });
    expect(d.dv).toBe(5);
  });

  it('applies APDS AP modifier (−4)', () => {
    const d = buildDamage(baseStats, { ...baseShot, ammoId: 'apds' });
    expect(d.ap).toBe(-4);
  });

  it('applies EX-Explosive (+1 DV, −1 AP)', () => {
    const d = buildDamage(baseStats, { ...baseShot, ammoId: 'ex-ex' });
    expect(d.dv).toBe(6);
    expect(d.ap).toBe(-1);
  });

  it('converts damage type to Stun for Gel rounds (+2 DV)', () => {
    const d = buildDamage(baseStats, { ...baseShot, ammoId: 'gel' });
    expect(d.dv).toBe(7);
    expect(d.type).toBe('S');
  });

  it('Stick-n-Shock forces S(e) and reduces DV by 2', () => {
    const d = buildDamage(baseStats, { ...baseShot, ammoId: 'stick-shock' });
    expect(d.dv).toBe(3);
    expect(d.type).toBe('S(e)');
  });

  it('stacks firing-mode bonus + ammo + net hits + base correctly', () => {
    // BF-narrow (+2), EX-Explosive (+1 DV, −1 AP), 3 net hits, base 5
    const d = buildDamage(baseStats, {
      ...baseShot,
      firingModeId: 'bf-narrow',
      ammoId: 'ex-ex',
      netHits: 3,
    });
    expect(d.dv).toBe(5 + 2 + 1 + 3);
    expect(d.ap).toBe(-1);
  });

  it('never produces a negative DV', () => {
    // Hypothetical: weapon base 1 with stick-n-shock −2 → clamps to 0
    const d = buildDamage(
      { ...baseStats, baseDV: 1 },
      { ...baseShot, ammoId: 'stick-shock' }
    );
    expect(d.dv).toBe(0);
  });
});
