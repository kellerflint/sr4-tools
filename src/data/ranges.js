// SR4 range modifiers are dice-pool penalties, not target numbers.
// Values shown are the default firearm range table; individual weapon
// types vary, but these cover the common case.
export const RANGES = [
  { id: 'short', label: 'Short', mod: 0, hint: 'No range penalty.' },
  { id: 'medium', label: 'Medium', mod: -1, hint: '−1 dice.' },
  { id: 'long', label: 'Long', mod: -3, hint: '−3 dice.' },
  { id: 'extreme', label: 'Extreme', mod: -6, hint: '−6 dice.' },
];
