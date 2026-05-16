import { useState } from 'react';
import WeaponsLibrary from '../components/DMLibrary/WeaponsLibrary.jsx';
import CharactersLibrary from '../components/DMLibrary/CharactersLibrary.jsx';
import CombatPanel from '../components/DMCombat/CombatPanel.jsx';

const TABS = [
  { id: 'combat', label: 'Combat' },
  { id: 'characters', label: 'Characters' },
  { id: 'weapons', label: 'Weapons' },
];

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
      {tab === 'characters' && <CharactersLibrary />}
      {tab === 'weapons' && <WeaponsLibrary />}
    </main>
  );
}
