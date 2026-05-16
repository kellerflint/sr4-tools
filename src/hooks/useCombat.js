import { useCallback } from 'react';
import usePersistentState from './usePersistentState.js';
import { generateId } from './useLibrary.js';
import { initiativeBase, initiativePool } from '../utils/combat.js';
import { rollPool } from '../utils/dice.js';

const DEFAULT_COMBAT = {
  combatants: [],
  combatTurn: 0,
  currentPass: 1,
};

function newCombatant(characterId) {
  return {
    id: generateId(),
    characterId,
    initScore: 0,
    passesActed: 0,
    currentPhysical: 0,
    currentStun: 0,
  };
}

export default function useCombat(charactersById) {
  const [combat, setCombat] = usePersistentState('sr4.combat', DEFAULT_COMBAT);

  const addCombatant = useCallback(
    (characterId) => {
      setCombat((c) => ({
        ...c,
        combatants: [...c.combatants, newCombatant(characterId)],
      }));
    },
    [setCombat]
  );

  const removeCombatant = useCallback(
    (combatantId) => {
      setCombat((c) => ({
        ...c,
        combatants: c.combatants.filter((cb) => cb.id !== combatantId),
      }));
    },
    [setCombat]
  );

  // Generic patch — used by setInitScore, health adjustments, etc.
  const updateCombatant = useCallback(
    (combatantId, patch) => {
      setCombat((c) => ({
        ...c,
        combatants: c.combatants.map((cb) =>
          cb.id === combatantId ? { ...cb, ...patch } : cb
        ),
      }));
    },
    [setCombat]
  );

  const setInitScore = useCallback(
    (combatantId, initScore) => updateCombatant(combatantId, { initScore }),
    [updateCombatant]
  );

  const setCombatantBox = useCallback(
    (combatantId, key, value) =>
      updateCombatant(combatantId, { [key]: Math.max(0, value) }),
    [updateCombatant]
  );

  // Roll initiative for every combatant whose character we can resolve.
  // Uses the SR4 rule the user confirmed: base = REA + INT, pool = REA + INT
  // dice; hits added to base.
  const rollAllInitiative = useCallback(() => {
    setCombat((c) => ({
      ...c,
      combatants: c.combatants.map((cb) => {
        const char = charactersById.get(cb.characterId);
        if (!char) return cb;
        const base = initiativeBase(char);
        const { hits } = rollPool(initiativePool(char));
        return { ...cb, initScore: base + hits, passesActed: 0 };
      }),
    }));
  }, [charactersById, setCombat]);

  const rollInitiativeFor = useCallback(
    (combatantId) => {
      setCombat((c) => {
        const cb = c.combatants.find((x) => x.id === combatantId);
        if (!cb) return c;
        const char = charactersById.get(cb.characterId);
        if (!char) return c;
        const base = initiativeBase(char);
        const { hits } = rollPool(initiativePool(char));
        return {
          ...c,
          combatants: c.combatants.map((x) =>
            x.id === combatantId ? { ...x, initScore: base + hits } : x
          ),
        };
      });
    },
    [charactersById, setCombat]
  );

  // Mark the combatant as having used one of their passes this turn.
  const advanceActor = useCallback(
    (combatantId) => {
      setCombat((c) => ({
        ...c,
        combatants: c.combatants.map((cb) =>
          cb.id === combatantId
            ? { ...cb, passesActed: (cb.passesActed || 0) + 1 }
            : cb
        ),
      }));
    },
    [setCombat]
  );

  // Advance to the next initiative pass within the current combat turn.
  // Combatants who already acted but still have IPs left become eligible
  // again. State of passesActed is preserved.
  const nextPass = useCallback(() => {
    setCombat((c) => ({ ...c, currentPass: (c.currentPass || 1) + 1 }));
  }, [setCombat]);

  // New combat turn — reset passesActed for everyone and put us back on
  // pass 1. Initiative is left alone so manually entered scores survive;
  // the DM clicks "Roll All" separately if they want a fresh roll.
  const newCombatTurn = useCallback(() => {
    setCombat((c) => ({
      ...c,
      combatTurn: (c.combatTurn || 0) + 1,
      currentPass: 1,
      combatants: c.combatants.map((cb) => ({ ...cb, passesActed: 0 })),
    }));
  }, [setCombat]);

  const resetCombat = useCallback(() => setCombat(DEFAULT_COMBAT), [setCombat]);

  return {
    combat,
    addCombatant,
    removeCombatant,
    setInitScore,
    setCombatantBox,
    updateCombatant,
    rollAllInitiative,
    rollInitiativeFor,
    advanceActor,
    nextPass,
    newCombatTurn,
    resetCombat,
  };
}
