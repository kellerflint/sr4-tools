import { useState } from 'react';
import StepCard from './StepCard.jsx';
import { rollPool } from '../../utils/dice.js';

function Die({ value, isHit, isOne }) {
  const tone = isHit
    ? 'border-success text-success'
    : isOne
    ? 'border-danger text-danger'
    : 'border-border text-muted';
  return (
    <span
      className={`grid h-8 w-8 place-items-center rounded border bg-surface-2 font-mono text-sm ${tone}`}
    >
      {value}
    </span>
  );
}

export default function RollStep({ dicePool, ruleOfSix, onReset, onRolled }) {
  const [result, setResult] = useState(null);

  const roll = () => {
    const r = rollPool(dicePool, { ruleOfSix });
    setResult(r);
    if (onRolled) onRolled(r.hits);
  };

  const handleReset = () => {
    setResult(null);
    if (onReset) onReset();
  };

  return (
    <StepCard
      index={6}
      title="Roll"
      hint={`${dicePool} dice${ruleOfSix ? ' · Rule of Six' : ''}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Reset shot
          </button>
          <button
            type="button"
            onClick={roll}
            disabled={dicePool === 0}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
          >
            Roll {dicePool}d6
          </button>
        </div>
      }
    >
      {!result && (
        <p className="text-sm text-muted">
          Press the button to roll the assembled dice pool. Hits are 5s and 6s.
        </p>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded bg-surface-2 px-3 py-1.5">
              <span className="text-xs uppercase tracking-wider text-muted">Hits</span>
              <span className="ml-2 text-2xl font-bold text-success">{result.hits}</span>
            </div>
            <div className="rounded bg-surface-2 px-3 py-1.5">
              <span className="text-xs uppercase tracking-wider text-muted">Ones</span>
              <span className="ml-2 text-lg font-semibold text-danger">{result.ones}</span>
            </div>
            {result.isCriticalGlitch && (
              <span className="rounded bg-danger px-2 py-1 text-xs font-bold uppercase text-white">
                Critical Glitch
              </span>
            )}
            {result.isGlitch && !result.isCriticalGlitch && (
              <span className="rounded border border-danger px-2 py-1 text-xs font-bold uppercase text-danger">
                Glitch
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {result.rolls.map((d, i) => (
              <Die key={i} value={d} isHit={d >= 5} isOne={d === 1} />
            ))}
          </div>
        </div>
      )}
    </StepCard>
  );
}
