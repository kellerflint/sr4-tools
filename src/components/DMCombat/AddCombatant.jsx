export default function AddCombatant({ characters, onAdd, onClose }) {
  return (
    <div className="rounded-md border border-accent bg-surface p-3" data-testid="add-combatant-picker">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Pick a Character
        </h3>
        <button
          type="button"
          onClick={onClose}
          data-testid="add-combatant-close"
          className="text-xs text-muted hover:text-text"
        >
          ×
        </button>
      </div>
      {characters.length === 0 ? (
        <p className="text-sm text-muted">
          No characters in the library yet. Add some on the Characters tab.
        </p>
      ) : (
        <ul className="space-y-1">
          {characters.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onAdd(c.id)}
                data-testid="add-combatant-option"
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-1.5 text-left text-sm text-text hover:border-accent"
              >
                <span className="font-medium" data-testid="add-combatant-option-name">
                  {c.name}
                </span>
                <span className="ml-2 text-xs text-muted">
                  BOD {c.attributes.bod} · AGI {c.attributes.agi} · REA {c.attributes.rea}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
