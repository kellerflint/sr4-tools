import { useCallback, useMemo, useState } from 'react';
import { FIRING_MODES } from '../data/firingModes.js';
import { MODIFIER_GROUPS } from '../data/modifiers.js';
import { AMMO_TYPES } from '../data/ammo.js';

const DEFAULT_STATS = {
  agility: 4,
  firearmsSkill: 4,
  smartlink: false,
  laserSight: false,
  recoilComp: 0,
  edge: 3,
  physicalDamage: 0,
  stunDamage: 0,
  // Weapon
  weaponName: 'Heavy Pistol',
  baseDV: 5,
  baseAP: 0,
  damageType: 'P', // 'P' or 'S'
};

const DEFAULT_SHOT = {
  rangeId: 'short',
  firingModeId: 'ss',
  faRounds: 6,
  modifiers: {}, // { groupId: optionId } for exclusive, { optionId: true } for non-exclusive
  customMod: { label: '', mod: 0 },
  aimActions: 0,
  edgeMode: 'none', // 'none' | 'add' | 'pushTheLimit' | 'reroll'
  edgeSpend: 0,
  ammoId: 'regular',
  netHitsMode: 'direct', // 'direct' | 'compute'
  netHits: 0,
  yourHits: 0,
  defenderHits: 0,
};

function woundPenalty(boxes) {
  return -Math.floor(boxes / 3);
}

export function useShootingState() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [shot, setShot] = useState(DEFAULT_SHOT);
  const [lastRollHits, setLastRollHits] = useState(null);

  const updateStats = useCallback((patch) => {
    setStats((s) => ({ ...s, ...patch }));
  }, []);

  const updateShot = useCallback((patch) => {
    setShot((s) => ({ ...s, ...patch }));
  }, []);

  const setExclusiveModifier = useCallback((groupId, optionId) => {
    setShot((s) => ({
      ...s,
      modifiers: { ...s.modifiers, [groupId]: optionId },
    }));
  }, []);

  const toggleModifier = useCallback((optionId) => {
    setShot((s) => {
      const next = { ...s.modifiers };
      if (next[optionId]) delete next[optionId];
      else next[optionId] = true;
      return { ...s, modifiers: next };
    });
  }, []);

  const updateCustomMod = useCallback((patch) => {
    setShot((s) => ({ ...s, customMod: { ...s.customMod, ...patch } }));
  }, []);

  const recordRoll = useCallback((hits) => {
    setLastRollHits(hits);
    setShot((s) =>
      s.netHitsMode === 'compute' ? { ...s, yourHits: hits } : s
    );
  }, []);

  const resetShot = useCallback(() => {
    setShot(DEFAULT_SHOT);
    setLastRollHits(null);
  }, []);

  const woundMod = useMemo(
    () => woundPenalty(stats.physicalDamage) + woundPenalty(stats.stunDamage),
    [stats.physicalDamage, stats.stunDamage]
  );

  return {
    stats,
    shot,
    woundMod,
    lastRollHits,
    updateStats,
    updateShot,
    setExclusiveModifier,
    toggleModifier,
    updateCustomMod,
    recordRoll,
    resetShot,
  };
}

// Resolve the effective net hits based on the user's chosen entry mode.
export function effectiveNetHits(shot) {
  if (shot.netHitsMode === 'compute') {
    return Math.max(0, (shot.yourHits || 0) - (shot.defenderHits || 0));
  }
  return Math.max(0, shot.netHits || 0);
}

// Pure calculator — given stats and shot, return the breakdown of dice
// pool components for display in the summary.
export function buildBreakdown(stats, shot, woundMod, ranges) {
  const range = ranges.find((r) => r.id === shot.rangeId);
  const mode = FIRING_MODES.find((m) => m.id === shot.firingModeId);

  const lines = [];

  lines.push({ label: 'Agility', value: stats.agility });
  lines.push({ label: 'Firearms', value: stats.firearmsSkill });

  if (range && range.mod) {
    lines.push({ label: `Range (${range.label})`, value: range.mod });
  }

  if (mode) {
    const uncompensated = Math.max(0, mode.recoil - stats.recoilComp);
    if (uncompensated > 0) {
      lines.push({
        label: `Recoil (${mode.short}: ${mode.recoil} − RC ${stats.recoilComp})`,
        value: -uncompensated,
      });
    }
  }

  if (stats.smartlink) lines.push({ label: 'Smartlink', value: 2 });
  if (stats.laserSight) lines.push({ label: 'Laser sight', value: 1 });

  if (shot.aimActions > 0) {
    lines.push({ label: `Aim (×${shot.aimActions})`, value: shot.aimActions });
  }

  // Situational modifiers from groups
  for (const group of MODIFIER_GROUPS) {
    if (group.exclusive) {
      const selectedId = shot.modifiers[group.id];
      if (!selectedId) continue;
      const opt = group.options.find((o) => o.id === selectedId);
      if (opt && opt.mod !== 0) {
        lines.push({ label: `${group.title}: ${opt.label}`, value: opt.mod });
      }
    } else {
      for (const opt of group.options) {
        if (shot.modifiers[opt.id] && opt.mod !== 0) {
          lines.push({ label: opt.label, value: opt.mod });
        }
      }
    }
  }

  if (woundMod !== 0) {
    lines.push({ label: 'Wound modifier', value: woundMod });
  }

  if (shot.customMod && shot.customMod.mod !== 0) {
    lines.push({
      label: shot.customMod.label.trim() || 'Custom',
      value: shot.customMod.mod,
    });
  }

  if (shot.edgeMode === 'add' && shot.edgeSpend > 0) {
    lines.push({ label: `Edge (added)`, value: shot.edgeSpend });
  }
  if (shot.edgeMode === 'pushTheLimit' && shot.edgeSpend > 0) {
    lines.push({ label: `Edge — Push the Limit`, value: shot.edgeSpend });
  }

  const total = lines.reduce((sum, l) => sum + l.value, 0);
  const dicePool = Math.max(0, total);

  return { lines, dicePool, range, mode };
}

// Damage calculator. Returns the breakdown of DV components, the final
// AP and damage type, plus a one-line summary the player can read out
// to the GM.
export function buildDamage(stats, shot) {
  const mode = FIRING_MODES.find((m) => m.id === shot.firingModeId);
  const ammo = AMMO_TYPES.find((a) => a.id === shot.ammoId) || AMMO_TYPES[0];

  const lines = [];
  lines.push({ label: `Base DV (${stats.weaponName || 'weapon'})`, value: stats.baseDV });

  if (mode && mode.bonus) {
    lines.push({ label: `${mode.short} bonus (${mode.rounds} rounds)`, value: mode.bonus });
  }
  if (ammo.dvMod) {
    lines.push({ label: `Ammo: ${ammo.label}`, value: ammo.dvMod });
  }
  const netHits = effectiveNetHits(shot);
  if (netHits > 0) {
    const label =
      shot.netHitsMode === 'compute'
        ? `Net hits (${shot.yourHits || 0} − ${shot.defenderHits || 0})`
        : 'Net hits';
    lines.push({ label, value: netHits });
  }

  const dv = Math.max(0, lines.reduce((sum, l) => sum + l.value, 0));
  const ap = stats.baseAP + ammo.apMod;
  const type = ammo.typeOverride || stats.damageType;

  return { lines, dv, ap, type, mode, ammo };
}
