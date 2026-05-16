// SR4 attributes — display order matches the typical character sheet.
export const ATTRIBUTES = [
  { id: 'bod', label: 'Body' },
  { id: 'agi', label: 'Agility' },
  { id: 'rea', label: 'Reaction' },
  { id: 'str', label: 'Strength' },
  { id: 'int', label: 'Intuition' },
  { id: 'log', label: 'Logic' },
  { id: 'wil', label: 'Willpower' },
  { id: 'cha', label: 'Charisma' },
  { id: 'edg', label: 'Edge' },
];

// Combat-relevant skills, lumped (Firearms covers Pistols/Automatics/etc).
export const SKILLS = [
  { id: 'firearms', label: 'Firearms' },
  { id: 'closeCombat', label: 'Close Combat' },
  { id: 'dodge', label: 'Dodge' },
  { id: 'perception', label: 'Perception' },
];

export const DEFAULT_CHARACTER = {
  name: '',
  attributes: {
    bod: 3, agi: 3, rea: 3, str: 3, int: 3, log: 3, wil: 3, cha: 3, edg: 3,
  },
  skills: {
    firearms: 0, closeCombat: 0, dodge: 0, perception: 0,
  },
  ipMax: 1,
  armorB: 0,
  armorI: 0,
  weaponIds: [],
};
