import NumberStepper from '../common/NumberStepper.jsx';
import {
  physicalTrackSize,
  stunTrackSize,
  woundModifier,
} from '../../utils/combat.js';

function HealthBar({ label, current, max, testId }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const tone =
    current >= max ? 'bg-danger' : current >= Math.ceil(max * 0.66) ? 'bg-danger/70' : 'bg-accent';
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted" data-testid={testId}>
      <span className="uppercase tracking-wider">{label}</span>
      <span className="relative h-1.5 w-16 overflow-hidden rounded bg-surface">
        <span className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-text">
        {current}/{max}
      </span>
    </div>
  );
}

export default function RosterRow({
  combatant,
  character,
  suffix,
  isCurrent,
  status, // 'ready' | 'acted' | 'done'
  onRemove,
  onRollInit,
  onSetInit,
  onAdvance,
  onAdjustPhysical,
  onAdjustStun,
}) {
  const missing = !character;
  const canAct = status === 'ready';
  // For backwards compat the data-exhausted flag means "can't act right
  // now" (covers both acted-this-pass and done-for-turn). The granular
  // data-status attribute exposes the actual state for fine-grained
  // assertions.
  const blocked = status !== 'ready';
  const wound = woundModifier(combatant);
  const phyMax = character ? physicalTrackSize(character) : 10;
  const stunMax = character ? stunTrackSize(character) : 10;

  return (
    <li
      data-testid="combatant-row"
      data-current={isCurrent ? 'true' : 'false'}
      data-exhausted={blocked ? 'true' : 'false'}
      data-status={status}
      className={`rounded-md border px-3 py-2 transition ${
        isCurrent
          ? 'border-accent bg-accent/10'
          : status === 'done'
          ? 'border-border bg-surface-2 opacity-30'
          : status === 'acted'
          ? 'border-border bg-surface-2 opacity-60'
          : 'border-border bg-surface-2'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-1 text-sm font-semibold text-text"
          data-testid="combatant-name"
        >
          {missing ? '(removed character)' : `${character.name}${suffix}`}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted">
          IP {character ? Math.max(0, character.ipMax - (combatant.passesActed || 0)) : '—'}
          /{character ? character.ipMax : '—'}
        </span>
        <button
          type="button"
          onClick={onRemove}
          data-testid="combatant-remove"
          className="text-xs text-muted hover:text-danger"
          title="Remove from combat"
        >
          ×
        </button>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted">Init</span>
        <NumberStepper
          value={combatant.initScore}
          onChange={onSetInit}
          min={0}
          max={40}
          testId="combatant-init"
        />
        <button
          type="button"
          onClick={onRollInit}
          disabled={missing}
          data-testid="combatant-roll-init"
          className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:text-text disabled:opacity-30"
        >
          Roll
        </button>
        <button
          type="button"
          onClick={onAdvance}
          disabled={!canAct}
          data-testid="combatant-advance"
          className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:text-text disabled:opacity-30"
        >
          Acted
        </button>
        {wound !== 0 && (
          <span
            className="ml-auto rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-danger"
            data-testid="combatant-wound-mod"
          >
            {wound} wounds
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap gap-3">
        <div className="flex items-center gap-1">
          <HealthBar
            label="Phys"
            current={combatant.currentPhysical}
            max={phyMax}
            testId="combatant-phys"
          />
          <button
            type="button"
            onClick={() => onAdjustPhysical(-1)}
            disabled={combatant.currentPhysical <= 0}
            data-testid="combatant-phys-dec"
            className="rounded border border-border px-1 text-xs text-muted hover:text-text disabled:opacity-30"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdjustPhysical(1)}
            data-testid="combatant-phys-inc"
            className="rounded border border-border px-1 text-xs text-muted hover:text-text"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-1">
          <HealthBar
            label="Stun"
            current={combatant.currentStun}
            max={stunMax}
            testId="combatant-stun"
          />
          <button
            type="button"
            onClick={() => onAdjustStun(-1)}
            disabled={combatant.currentStun <= 0}
            data-testid="combatant-stun-dec"
            className="rounded border border-border px-1 text-xs text-muted hover:text-text disabled:opacity-30"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdjustStun(1)}
            data-testid="combatant-stun-inc"
            className="rounded border border-border px-1 text-xs text-muted hover:text-text"
          >
            +
          </button>
        </div>
      </div>
    </li>
  );
}
