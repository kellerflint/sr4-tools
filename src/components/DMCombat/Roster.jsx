import { useState } from 'react';
import RosterRow from './RosterRow.jsx';
import AddCombatant from './AddCombatant.jsx';
import {
  buildCombatantSuffixes,
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

  const sorted = sortRoster(combat.combatants, charactersById);
  const currentActorId = pickNextActor(combat.combatants, charactersById);
  const suffixes = buildCombatantSuffixes(combat.combatants);

  return (
    <section data-testid="dm-roster" className="rounded-lg border border-border bg-surface p-3 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Roster
          </h2>
          <p className="text-xs text-muted" data-testid="combat-turn">
            Combat turn {combat.combatTurn || 0}
          </p>
        </div>
        <div className="flex gap-1">
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
          {sorted.map((cb) => (
            <RosterRow
              key={cb.id}
              combatant={cb}
              character={charactersById.get(cb.characterId)}
              suffix={suffixes.get(cb.id) || ''}
              isCurrent={cb.id === currentActorId}
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
          ))}
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
