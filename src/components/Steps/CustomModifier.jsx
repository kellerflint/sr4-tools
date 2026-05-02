import NumberStepper from '../common/NumberStepper.jsx';

export default function CustomModifier({ value, onChange }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-2 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        Custom Modifier
      </h4>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Describe it (e.g. House rule, GM ruling)…"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <NumberStepper
          value={value.mod}
          onChange={(mod) => onChange({ mod })}
          min={-12}
          max={12}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Negative values are penalties, positive values are bonuses. Anything non-zero
        is included in the dice pool.
      </p>
    </div>
  );
}
