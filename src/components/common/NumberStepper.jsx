export default function NumberStepper({ value, onChange, min = 0, max = 99, step = 1, testId }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface-2">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        data-testid={testId ? `${testId}-dec` : undefined}
        className="px-2 py-1 text-muted hover:text-text disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        data-testid={testId ? `${testId}-value` : undefined}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-12 bg-transparent text-center text-text outline-none"
      />
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        data-testid={testId ? `${testId}-inc` : undefined}
        className="px-2 py-1 text-muted hover:text-text disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
