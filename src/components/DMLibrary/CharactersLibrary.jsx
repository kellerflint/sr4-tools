import { useState } from 'react';
import useLibrary from '../../hooks/useLibrary.js';
import CharacterForm from './CharacterForm.jsx';

function summarize(c, weaponsById) {
  const parts = [];
  parts.push(
    `BOD ${c.attributes.bod} · AGI ${c.attributes.agi} · REA ${c.attributes.rea}`
  );
  parts.push(`Firearms ${c.skills.firearms} · Close ${c.skills.closeCombat} · Dodge ${c.skills.dodge}`);
  parts.push(`Armor ${c.armorB}/${c.armorI} · IP ${c.ipMax}`);
  const weaponNames = (c.weaponIds || [])
    .map((id) => weaponsById.get(id)?.name)
    .filter(Boolean);
  if (weaponNames.length) parts.push(`Weapons: ${weaponNames.join(', ')}`);
  else parts.push('No weapons attached');
  return parts;
}

function CharacterRow({ character, weaponsById, onEdit, onDelete }) {
  const lines = summarize(character, weaponsById);
  return (
    <li
      data-testid="character-row"
      className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
    >
      <div className="flex-1">
        <div
          className="text-sm font-semibold text-text"
          data-testid="character-row-name"
        >
          {character.name}
        </div>
        <div className="text-xs text-muted" data-testid="character-row-summary">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        data-testid="character-row-edit"
        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        data-testid="character-row-delete"
        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-danger hover:text-danger"
      >
        Delete
      </button>
    </li>
  );
}

export default function CharactersLibrary() {
  const { items: characters, add, update, remove } = useLibrary('sr4.characters');
  const { items: weapons } = useLibrary('sr4.weapons');
  const [editing, setEditing] = useState(null);

  const weaponsById = new Map(weapons.map((w) => [w.id, w]));

  const handleSave = (data) => {
    if (editing === 'new') add(data);
    else update(editing, data);
    setEditing(null);
  };

  const editingCharacter =
    editing && editing !== 'new'
      ? characters.find((c) => c.id === editing)
      : null;

  return (
    <section data-testid="dm-characters-panel" className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Characters Library
        </h2>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            data-testid="character-add-button"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            + Add Character
          </button>
        )}
      </header>

      {editing !== null && (
        <CharacterForm
          initialValue={editingCharacter || undefined}
          weapons={weapons}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {characters.length === 0 && editing === null && (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            No characters yet. Click <span className="text-text">+ Add Character</span> to create one.
          </p>
        </div>
      )}

      {characters.length > 0 && (
        <ul className="space-y-2" data-testid="characters-list">
          {characters.map((c) => (
            <CharacterRow
              key={c.id}
              character={c}
              weaponsById={weaponsById}
              onEdit={() => setEditing(c.id)}
              onDelete={() => remove(c.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
