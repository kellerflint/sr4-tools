import { useState } from 'react';
import WeaponsLibrary from '../components/DMLibrary/WeaponsLibrary.jsx';
import CharactersLibrary from '../components/DMLibrary/CharactersLibrary.jsx';

const TABS = [
  { id: 'combat', label: 'Combat' },
  { id: 'characters', label: 'Characters' },
  { id: 'weapons', label: 'Weapons' },
];

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

function CombatPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_320px]" data-testid="dm-combat-panel">
      <EmptyPanel
        title="Roster"
        body="No combatants yet. Pull characters from your library to start a fight."
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

function CharactersPanel() {
  return <CharactersLibrary />;
}

function WeaponsPanel() {
  return <WeaponsLibrary />;
}

export default function DMPage() {
  const [tab, setTab] = useState('combat');

  return (
    <main className="mx-auto max-w-7xl px-4 py-6" data-testid="page-dm">
      <div
        className="mb-4 inline-flex overflow-hidden rounded-md border border-border bg-surface"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`dm-tab-${t.id}`}
            data-active={tab === t.id ? 'true' : 'false'}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm transition ${
              tab === t.id
                ? 'bg-accent text-accent-fg'
                : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'combat' && <CombatPanel />}
      {tab === 'characters' && <CharactersPanel />}
      {tab === 'weapons' && <WeaponsPanel />}
    </main>
  );
}
