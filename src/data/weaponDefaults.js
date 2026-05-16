// Available firing modes a ranged weapon profile can support.
// (SS/SA/BF/FA — narrow vs wide is a per-shot choice during resolution.)
export const FIRE_MODE_OPTIONS = [
  { id: 'ss', label: 'SS' },
  { id: 'sa', label: 'SA' },
  { id: 'bf', label: 'BF' },
  { id: 'fa', label: 'FA' },
];

export const DEFAULT_WEAPON = {
  name: '',
  kind: 'ranged', // 'ranged' | 'melee'
  dv: 5,
  ap: 0,
  damageType: 'P', // 'P' | 'S'
  // ranged-only
  modes: ['ss', 'sa'],
  rc: 0,
  hasSmartlink: false,
  hasLaser: false,
  // melee-only
  reach: 0,
};
