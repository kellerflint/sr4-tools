// SR4 ammo types. dvMod and apMod are added to the weapon's base values.
// typeOverride forces a damage type (P/S/Se = stun electrical).
export const AMMO_TYPES = [
  {
    id: 'regular',
    label: 'Regular',
    dvMod: 0,
    apMod: 0,
    hint: 'Standard rounds. No change.',
  },
  {
    id: 'apds',
    label: 'APDS',
    dvMod: 0,
    apMod: -4,
    hint: 'Armor-piercing. −4 AP (better penetration).',
  },
  {
    id: 'ex-ex',
    label: 'EX-Explosive',
    dvMod: 1,
    apMod: -1,
    hint: '+1 DV, −1 AP.',
  },
  {
    id: 'gel',
    label: 'Gel rounds',
    dvMod: 2,
    apMod: 0,
    typeOverride: 'S',
    hint: '+2 DV, converts damage to Stun.',
  },
  {
    id: 'hollow',
    label: 'Hollow Point',
    dvMod: 1,
    apMod: 2,
    hint: '+1 DV, +2 AP (worse vs armor).',
  },
  {
    id: 'stick-shock',
    label: 'Stick-n-Shock',
    dvMod: -2,
    apMod: 0,
    typeOverride: 'S(e)',
    hint: 'Electrical Stun. −2 DV. Doubles armor for resistance.',
  },
];
