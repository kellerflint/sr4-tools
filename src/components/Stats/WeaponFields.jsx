import StatField from './StatField.jsx';

export default function WeaponFields({ stats, onChange }) {
  const set = (key) => (value) => onChange({ [key]: value });

  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Weapon
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="text-xs font-medium uppercase tracking-wider text-muted">
            Name
          </label>
          <input
            type="text"
            value={stats.weaponName}
            onChange={(e) => onChange({ weaponName: e.target.value })}
            placeholder="Heavy Pistol"
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <StatField
          label="Base DV"
          value={stats.baseDV}
          onChange={set('baseDV')}
          min={0}
          max={20}
          hint="Weapon damage value."
        />
        <StatField
          label="Base AP"
          value={stats.baseAP}
          onChange={set('baseAP')}
          min={-10}
          max={10}
          hint="Negative = better."
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider text-muted">
            Damage Type
          </label>
          <div className="inline-flex overflow-hidden rounded-md border border-border bg-surface">
            {['P', 'S'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ damageType: t })}
                className={`flex-1 px-3 py-1.5 text-sm transition ${
                  stats.damageType === t
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:text-text'
                }`}
              >
                {t === 'P' ? 'Physical' : 'Stun'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
