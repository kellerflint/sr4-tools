import { useState } from 'react';
import RosterRow from './RosterRow.jsx';
import AddCombatant from './AddCombatant.jsx';
import {
  buildCombatantSuffixes,
  combatantStatus,
  pickNextActor,
  sortRoster,
} from '../../utils/combat.js';

export default function Roster({
  combat,
  characters,
  charactersById,
  combatActions,
}) {
  const [adding, setAdding] = useState(false);

  const currentPass = combat.currentPass || 1;
  const sorted = sortRoster(combat.combatants, charactersById, currentPass);
  const currentActorId = pickNextActor(combat.combatants, charactersById, currentPass);
  const suffixes = buildCombatantSuffixes(combat.combatants);

  return (
    <section data-testid="dm-roster" className="rounded-lg border border-border bg-surface p-3 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Roster
          </h2>
          <p className="text-xs text-muted">
            <span data-testid="combat-turn">Combat turn {combat.combatTurn || 0}</span>
            {' · '}
            <span data-testid="current-pass">Pass {currentPass}</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <button
            type="button"
            onClick={combatActions.rollAllInitiative}
            disabled={combat.combatants.length === 0}
            data-testid="roll-all-initiative"
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text disabled:opacity-30"
          >
            Roll All
          </button>
          <button
            type="button"
            onClick={combatActions.newCombatTurn}
            disabled={combat.combatants.length === 0}
            data-testid="new-combat-turn"
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text disabled:opacity-30"
          >
            New Turn
          </button>
        </div>
      </header>

      {sorted.length === 0 && !adding && (
        <p className="text-sm text-muted">
          No combatants yet. Pull characters from the library to start.
        </p>
      )}

      {sorted.length > 0 && (
        <ul className="space-y-2">
          {sorted.map((cb) => {
            const character = charactersById.get(cb.characterId);
            const status = combatantStatus(cb, character, currentPass);
            return (
              <RosterRow
                key={cb.id}
                combatant={cb}
                character={character}
                suffix={suffixes.get(cb.id) || ''}
                isCurrent={cb.id === currentActorId}
                status={status}
                onRemove={() => combatActions.removeCombatant(cb.id)}
                onRollInit={() => combatActions.rollInitiativeFor(cb.id)}
                onSetInit={(v) => combatActions.setInitScore(cb.id, v)}
                onAdvance={() => combatActions.advanceActor(cb.id)}
                onAdjustPhysical={(delta) =>
                  combatActions.setCombatantBox(cb.id, 'currentPhysical', cb.currentPhysical + delta)
                }
                onAdjustStun={(delta) =>
                  combatActions.setCombatantBox(cb.id, 'currentStun', cb.currentStun + delta)
                }
              />
            );
          })}
        </ul>
      )}

      {adding ? (
        <AddCombatant
          characters={characters}
          onAdd={(id) => {
            combatActions.addCombatant(id);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          data-testid="add-combatant-button"
          className="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-accent hover:text-text"
        >
          + Add Combatant
        </button>
      )}
    </section>
  );
}
