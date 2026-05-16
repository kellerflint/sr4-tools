export default function Summary({ breakdown, damage }) {
  const { lines, dicePool, mode } = breakdown;

  return (
    <aside className="sticky top-4 space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Dice Pool
        </h2>

        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-accent" data-testid="dice-pool">
            {dicePool}
          </span>
          <span className="text-sm text-muted">dice to roll</span>
        </div>

        <ul className="space-y-1 border-t border-border pt-3">
          {lines.map((l, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-text">{l.label}</span>
              <span
                className={`font-mono ${
                  l.value > 0 ? 'text-success' : l.value < 0 ? 'text-danger' : 'text-muted'
                }`}
              >
                {l.value > 0 ? `+${l.value}` : l.value}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-muted">
          Hit on 5+ · Glitch on half-or-more 1s · Net hits add to DV.
        </p>
      </div>

      {damage && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Damage
          </h2>
          <div className="flex items-baseline gap-4">
            <div>
              <div className="text-xs uppercase text-muted">DV</div>
              <div className="text-3xl font-bold text-text" data-testid="summary-dv">
                {damage.dv}
                {damage.type}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted">AP</div>
              <div className="text-3xl font-bold text-text" data-testid="summary-ap">
                {damage.ap > 0 ? `+${damage.ap}` : damage.ap}
              </div>
            </div>
          </div>
          {mode && mode.bonus ? (
            <p className="mt-2 text-xs text-muted">
              Includes +{mode.bonus} from {mode.short}.
            </p>
          ) : null}
        </div>
      )}
    </aside>
  );
}
