// SR4 situational modifiers — all are dice-pool deltas (negative = penalty,
// positive = bonus). Groups marked `exclusive` only allow one selection.

export const MODIFIER_GROUPS = [
  {
    id: 'visibility',
    title: 'Visibility',
    exclusive: true,
    options: [
      { id: 'vis-clear', label: 'Clear', mod: 0 },
      { id: 'vis-partial', label: 'Partial light / glare / light smoke', mod: -2 },
      { id: 'vis-poor', label: 'Bad light / heavy smoke', mod: -4 },
      { id: 'vis-none', label: 'Total darkness / blind', mod: -6 },
    ],
  },
  {
    id: 'vision-aid',
    title: 'Vision Augmentation',
    exclusive: false,
    options: [
      { id: 'low-light', label: 'Low-light vision (cancels low light)', mod: 0, note: 'Negates partial/poor light up to its limit.' },
      { id: 'thermo', label: 'Thermographic (sees through heat smoke)', mod: 0 },
      { id: 'flare-comp', label: 'Flare compensation', mod: 0 },
    ],
  },
  {
    id: 'cover',
    title: 'Cover',
    exclusive: true,
    options: [
      { id: 'cov-none', label: 'No cover', mod: 0 },
      { id: 'cov-partial', label: 'Partial cover (1/4)', mod: -2 },
      { id: 'cov-good', label: 'Good cover (1/2)', mod: -4 },
      { id: 'cov-superior', label: 'Superior cover (3/4)', mod: -6 },
    ],
  },
  {
    id: 'shooter-movement',
    title: 'Shooter Movement',
    exclusive: true,
    options: [
      { id: 'sh-still', label: 'Stationary', mod: 0 },
      { id: 'sh-walking', label: 'Walking', mod: -1 },
      { id: 'sh-running', label: 'Running', mod: -3 },
      { id: 'sh-vehicle', label: 'Firing from moving vehicle', mod: -3 },
    ],
  },
  {
    id: 'target-movement',
    title: 'Target Movement',
    exclusive: true,
    options: [
      { id: 'tgt-still', label: 'Stationary / walking', mod: 0 },
      { id: 'tgt-running', label: 'Running', mod: -2 },
      { id: 'tgt-vehicle', label: 'In a moving vehicle', mod: -3 },
    ],
  },
  {
    id: 'situational',
    title: 'Situational',
    exclusive: false,
    options: [
      { id: 'called-shot', label: 'Called shot', mod: -4 },
      { id: 'multi-target', label: 'Additional target (per extra)', mod: -2 },
      { id: 'wrong-hand', label: 'Off-hand / wrong hand', mod: -2 },
      { id: 'prone-near', label: 'Target prone, within 5m', mod: -2 },
      { id: 'prone-far', label: 'Target prone, beyond 5m', mod: 2 },
      { id: 'in-melee', label: 'Target in melee', mod: -3 },
      { id: 'blind-fire', label: 'Blind fire', mod: -6 },
    ],
  },
];

// Aim is taken as Take Aim simple actions; +1 per action, capped.
// Cap is normally Skill rating, but in practice +3 covers most cases
// without a smartlink/scope. We keep this configurable in the UI.
export const DEFAULT_AIM_CAP = 6;
