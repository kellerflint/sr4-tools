import { useMemo } from 'react';
import useLibrary from '../../hooks/useLibrary.js';
import useCombat from '../../hooks/useCombat.js';
import Roster from './Roster.jsx';

function EmptyPanel({ title, body }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <p className="text-sm text-muted">{body}</p>
    </div>
  );
}

export default function CombatPanel() {
  const { items: characters } = useLibrary('sr4.characters');
  const charactersById = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters]
  );
  const combatActions = useCombat(charactersById);

  return (
    <div
      className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_320px]"
      data-testid="dm-combat-panel"
    >
      <Roster
        combat={combatActions.combat}
        characters={characters}
        charactersById={charactersById}
        combatActions={combatActions}
      />
      <EmptyPanel
        title="Setup"
        body="Pick an attacker and a target to begin resolving an attack."
      />
      <EmptyPanel
        title="Combat Log"
        body="Resolved actions will appear here as a running transcript."
      />
    </div>
  );
}
