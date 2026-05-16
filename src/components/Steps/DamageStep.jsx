import StepCard from './StepCard.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import NetHitsInput from './NetHitsInput.jsx';
import { AMMO_TYPES } from '../../data/ammo.js';

function TypeLabel({ type }) {
  const long =
    type === 'P'
      ? 'Physical'
      : type === 'S'
      ? 'Stun'
      : type === 'S(e)'
      ? 'Stun (electrical)'
      : type;
  return <span title={long}>{type}</span>;
}

export default function DamageStep({
  shot,
  damage,
  lastRollHits,
  onChangeAmmo,
  onChangeNetHits,
  onChangeNetHitsMode,
  onChangeYourHits,
  onChangeDefenderHits,
}) {
  const { lines, dv, ap, type, ammo } = damage;

  return (
    <StepCard
      index={7}
      title="Damage"
      hint="What you tell the DM after the roll."
    >
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Ammo Loaded
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMMO_TYPES.map((a) => (
              <ChoiceButton
                key={a.id}
                active={shot.ammoId === a.id}
                onClick={() => onChangeAmmo(a.id)}
                sub={a.hint}
                testId={`ammo-${a.id}`}
              >
                {a.label}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <NetHitsInput
          mode={shot.netHitsMode}
          netHits={shot.netHits}
          yourHits={shot.yourHits}
          defenderHits={shot.defenderHits}
          lastRollHits={lastRollHits}
          onChangeMode={onChangeNetHitsMode}
          onChangeNetHits={onChangeNetHits}
          onChangeYourHits={onChangeYourHits}
          onChangeDefenderHits={onChangeDefenderHits}
        />

        <div className="rounded-lg border border-accent bg-accent/10 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Tell your DM
          </div>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div>
              <div className="text-xs uppercase text-muted">Damage</div>
              <div className="text-3xl font-bold text-text" data-testid="damage-dv">
                {dv}
                <TypeLabel type={type} />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted">AP</div>
              <div className="text-3xl font-bold text-text" data-testid="damage-ap">
                {ap > 0 ? `+${ap}` : ap}
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm italic text-muted">
            "I'm hitting for {dv}{' '}
            {type === 'P'
              ? 'Physical'
              : type === 'S'
              ? 'Stun'
              : 'Stun electrical'}
            , AP {ap > 0 ? `+${ap}` : ap}."
          </p>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            DV Breakdown
          </h4>
          <ul className="space-y-1 rounded-md border border-border bg-surface-2 p-3">
            {lines.map((l, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-text">{l.label}</span>
                <span
                  className={`font-mono ${
                    l.value > 0
                      ? 'text-success'
                      : l.value < 0
                      ? 'text-danger'
                      : 'text-muted'
                  }`}
                >
                  {l.value > 0 ? `+${l.value}` : l.value}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
              <span className="text-text">Final DV</span>
              <span className="font-mono text-text">
                {dv}
                {type}
              </span>
            </li>
          </ul>
          {ammo.id === 'stick-shock' && (
            <p className="mt-2 text-xs text-muted">
              Stick-n-Shock: defender uses doubled armor for the resistance test.
            </p>
          )}
        </div>

        <p className="text-xs text-muted">
          The DM rolls Body + (Armor + AP, min 0) to resist; each hit cancels 1 DV.
          Anything left becomes damage.
        </p>
      </div>
    </StepCard>
  );
}
