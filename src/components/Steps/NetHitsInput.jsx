import NumberStepper from '../common/NumberStepper.jsx';

const MODES = [
  { id: 'direct', label: 'Type net hits' },
  { id: 'compute', label: 'Subtract defender hits' },
];

export default function NetHitsInput({
  mode,
  netHits,
  yourHits,
  defenderHits,
  lastRollHits,
  onChangeMode,
  onChangeNetHits,
  onChangeYourHits,
  onChangeDefenderHits,
}) {
  const computed = Math.max(0, (yourHits || 0) - (defenderHits || 0));

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Net Hits
        </h4>
        <div className="inline-flex overflow-hidden rounded-md border border-border bg-surface">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeMode(m.id)}
              className={`px-3 py-1 text-xs transition ${
                mode === m.id
                  ? 'bg-accent text-accent-fg'
                  : 'text-muted hover:text-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'direct' && (
        <div className="flex items-center gap-3">
          <NumberStepper
            value={netHits}
            onChange={onChangeNetHits}
            min={0}
            max={30}
          />
          <span className="text-xs text-muted">
            Just type whatever you / the table calculated.
          </span>
        </div>
      )}

      {mode === 'compute' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="w-32 text-muted">Your hits</span>
              <NumberStepper
                value={yourHits}
                onChange={onChangeYourHits}
                min={0}
                max={30}
              />
            </label>
            {lastRollHits != null && lastRollHits !== yourHits && (
              <button
                type="button"
                onClick={() => onChangeYourHits(lastRollHits)}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text"
              >
                Use app roll: {lastRollHits}
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="w-32 text-muted">Defender hits</span>
            <NumberStepper
              value={defenderHits}
              onChange={onChangeDefenderHits}
              min={0}
              max={30}
            />
          </label>
          <div className="rounded-md bg-surface-2 px-3 py-2 text-sm">
            <span className="text-muted">Net hits: </span>
            <span className="text-lg font-bold text-text">{computed}</span>
            <span className="ml-2 text-xs text-muted">
              (max(0, {yourHits || 0} − {defenderHits || 0}))
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
