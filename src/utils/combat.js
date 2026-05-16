// SR4 combat-derived values + queue-ordering helpers.
// All exports here are pure so they can be unit-tested without React.

export function initiativeBase(character) {
  return character.attributes.rea + character.attributes.int;
}

// Initiative pool dice the character rolls each combat turn — same as
// the base score by user-supplied SR4 rule (REA + INT).
export function initiativePool(character) {
  return character.attributes.rea + character.attributes.int;
}

export function physicalTrackSize(character) {
  return 8 + Math.ceil(character.attributes.bod / 2);
}

export function stunTrackSize(character) {
  return 8 + Math.ceil(character.attributes.wil / 2);
}

// −1 per 3 boxes filled on each track, summed across both tracks.
export function woundModifier(combatant) {
  const p = Math.floor((combatant.currentPhysical || 0) / 3);
  const s = Math.floor((combatant.currentStun || 0) / 3);
  return 0 - p - s;
}

// Has the combatant used every one of their initiative passes for the
// current combat turn? (Done until New Combat Turn.)
export function isExhausted(combatant, character) {
  if (!character) return true;
  return (combatant.passesActed || 0) >= (character.ipMax || 1);
}

// Three-state status of a combatant within the current initiative pass:
//   'ready' — can act now (passesActed < currentPass AND has IPs left)
//   'acted' — already acted this pass; has more IPs (waits for Next Pass)
//   'done'  — used every IP this combat turn
export function combatantStatus(combatant, character, currentPass = 1) {
  if (!character) return 'done';
  const passes = combatant.passesActed || 0;
  if (passes >= character.ipMax) return 'done';
  if (passes >= currentPass) return 'acted';
  return 'ready';
}

// Can this combatant click "Acted" right now?
export function canActNow(combatant, character, currentPass = 1) {
  return combatantStatus(combatant, character, currentPass) === 'ready';
}

// Highest-initScore combatant who can act THIS pass. Returns null when
// nobody can act right now (DM should advance to Next Pass).
export function pickNextActor(combatants, charactersById, currentPass = 1) {
  const eligible = combatants.filter((c) =>
    canActNow(c, charactersById.get(c.characterId), currentPass)
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => b.initScore - a.initScore);
  return eligible[0].id;
}

// Display order:
//   1. ready combatants by init score desc
//   2. acted-this-pass combatants by init score desc
//   3. done combatants by init score desc
// JS sort is stable (ES2019+) so equal-rank combatants keep insertion order.
const STATUS_RANK = { ready: 0, acted: 1, done: 2 };
export function sortRoster(combatants, charactersById, currentPass = 1) {
  return [...combatants].sort((a, b) => {
    const aRank = STATUS_RANK[combatantStatus(a, charactersById.get(a.characterId), currentPass)];
    const bRank = STATUS_RANK[combatantStatus(b, charactersById.get(b.characterId), currentPass)];
    if (aRank !== bRank) return aRank - bRank;
    return b.initScore - a.initScore;
  });
}

// Disambiguate combatants that share a characterId. Returns a Map
// keyed by combatant.id → suffix string ("" if unique, " #1", " #2", ...
// when duplicated).
export function buildCombatantSuffixes(combatants) {
  const result = new Map();
  const counts = new Map();
  // First pass: total count per characterId
  for (const c of combatants) {
    counts.set(c.characterId, (counts.get(c.characterId) || 0) + 1);
  }
  // Second pass: assign per-instance suffix only when there's a dupe
  const seen = new Map();
  for (const c of combatants) {
    if (counts.get(c.characterId) <= 1) {
      result.set(c.id, '');
    } else {
      const n = (seen.get(c.characterId) || 0) + 1;
      seen.set(c.characterId, n);
      result.set(c.id, ` #${n}`);
    }
  }
  return result;
}
