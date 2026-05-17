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

// Display order, three explicit categories sorted by INIT desc within each:
//   Cat 1 (ready)  — haven't acted this pass, can act now
//   Cat 2 (acted)  — already acted this pass, have more passes left
//   Cat 3 (done)   — no passes left for the combat turn
// Stable insertion-order tiebreak within ties.
const STATUS_RANK = { ready: 0, acted: 1, done: 2 };
export function sortRoster(combatants, charactersById, currentPass = 1) {
  return [...combatants].sort((a, b) => {
    const aRank = STATUS_RANK[combatantStatus(a, charactersById.get(a.characterId), currentPass)];
    const bRank = STATUS_RANK[combatantStatus(b, charactersById.get(b.characterId), currentPass)];
    if (aRank !== bRank) return aRank - bRank;
    return b.initScore - a.initScore;
  });
}

// After any combatant acts, walk the auto-cascade rules to find the
// settled state:
//   - if Cat 1 has someone, do nothing
//   - elif Cat 2 has someone, advance currentPass (those Cat 2 people
//     become Cat 1)
//   - else (everyone in Cat 3), start the next combat turn: reset
//     passesActed to 0, currentPass to 1, combatTurn += 1
// Loops because a turn-advance might still need another step in weird
// edge cases. Pure.
export function autoAdvance(
  combatants,
  charactersById,
  currentPass = 1,
  combatTurn = 0
) {
  let pass = currentPass;
  let turn = combatTurn;
  let list = combatants;
  if (list.length === 0) return { combatants: list, currentPass: pass, combatTurn: turn };

  for (let i = 0; i < 100; i++) {
    const cat1 = list.some(
      (c) => combatantStatus(c, charactersById.get(c.characterId), pass) === 'ready'
    );
    if (cat1) return { combatants: list, currentPass: pass, combatTurn: turn };

    const cat2 = list.some(
      (c) => combatantStatus(c, charactersById.get(c.characterId), pass) === 'acted'
    );
    if (cat2) {
      pass++;
      continue;
    }

    // Everyone is in Cat 3 (done). Start a new combat turn.
    list = list.map((c) => ({ ...c, passesActed: 0 }));
    pass = 1;
    turn = (turn || 0) + 1;
  }
  return { combatants: list, currentPass: pass, combatTurn: turn };
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
