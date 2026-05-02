import StepCard from './StepCard.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import { FIRING_MODES } from '../../data/firingModes.js';

export default function FiringModeStep({ value, onChange, recoilComp }) {
  return (
    <StepCard
      index={2}
      title="Firing Mode"
      hint={`RC ${recoilComp} compensates recoil 1-for-1`}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {FIRING_MODES.map((m) => {
          const uncomp = Math.max(0, m.recoil - recoilComp);
          const recoilLabel =
            m.recoil === 0
              ? 'no recoil'
              : `recoil ${m.recoil} → ${uncomp === 0 ? 'compensated' : `−${uncomp}`}`;
          return (
            <ChoiceButton
              key={m.id}
              active={value === m.id}
              onClick={() => onChange(m.id)}
              sub={`${m.rounds} round${m.rounds > 1 ? 's' : ''} · ${recoilLabel}${
                m.bonus ? ` · +${m.bonus} DV` : ''
              }`}
              mod={uncomp ? -uncomp : 0}
            >
              {m.label}
            </ChoiceButton>
          );
        })}
      </div>
    </StepCard>
  );
}
