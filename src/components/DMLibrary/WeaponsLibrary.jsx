import { useState } from 'react';
import useLibrary from '../../hooks/useLibrary.js';
import WeaponForm from './WeaponForm.jsx';

function formatSummary(w) {
  const dv = `DV ${w.dv}${w.damageType}`;
  const ap = `AP ${w.ap > 0 ? `+${w.ap}` : w.ap}`;
  if (w.kind === 'ranged') {
    const modes = w.modes && w.modes.length ? w.modes.map((m) => m.toUpperCase()).join('/') : '—';
    return `${dv} · ${ap} · ${modes} · RC ${w.rc}`;
  }
  return `${dv} · ${ap} · Reach ${w.reach}`;
}

function WeaponRow({ weapon, onEdit, onDelete }) {
  return (
    <li
      data-testid="weapon-row"
      className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
    >
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-text" data-testid="weapon-row-name">
            {weapon.name}
          </span>
          <span
            className="rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted"
            data-testid="weapon-row-kind"
          >
            {weapon.kind}
          </span>
        </div>
        <div className="text-xs text-muted" data-testid="weapon-row-summary">
          {formatSummary(weapon)}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        data-testid="weapon-row-edit"
        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        data-testid="weapon-row-delete"
        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-danger hover:text-danger"
      >
        Delete
      </button>
    </li>
  );
}

export default function WeaponsLibrary() {
  const { items, add, update, remove } = useLibrary('sr4.weapons');
  // null = no form open; 'new' = adding; an id = editing that weapon.
  const [editing, setEditing] = useState(null);

  const handleSave = (data) => {
    if (editing === 'new') add(data);
    else update(editing, data);
    setEditing(null);
  };

  const editingWeapon = editing && editing !== 'new'
    ? items.find((w) => w.id === editing)
    : null;

  return (
    <section data-testid="dm-weapons-panel" className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Weapons Library
        </h2>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            data-testid="weapon-add-button"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            + Add Weapon
          </button>
        )}
      </header>

      {editing !== null && (
        <WeaponForm
          initialValue={editingWeapon || undefined}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {items.length === 0 && editing === null && (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            No weapons yet. Click <span className="text-text">+ Add Weapon</span> to define one.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-2" data-testid="weapons-list">
          {items.map((w) => (
            <WeaponRow
              key={w.id}
              weapon={w}
              onEdit={() => setEditing(w.id)}
              onDelete={() => remove(w.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
