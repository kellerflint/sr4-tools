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

// Has the combatant exhausted all their initiative passes this turn?
export function isExhausted(combatant, character) {
  if (!character) return true;
  return (combatant.passesActed || 0) >= (character.ipMax || 1);
}

// Highest-initScore combatant who still has passes left. Returns null when
// nobody can act this pass.
export function pickNextActor(combatants, charactersById) {
  const eligible = combatants.filter(
    (c) => !isExhausted(c, charactersById.get(c.characterId))
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => b.initScore - a.initScore);
  return eligible[0].id;
}

// Display order: active combatants by init score desc, then exhausted
// ones at the bottom (also init score desc among themselves).
export function sortRoster(combatants, charactersById) {
  return [...combatants].sort((a, b) => {
    const aChar = charactersById.get(a.characterId);
    const bChar = charactersById.get(b.characterId);
    const aDone = isExhausted(a, aChar);
    const bDone = isExhausted(b, bChar);
    if (aDone !== bDone) return aDone ? 1 : -1;
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
