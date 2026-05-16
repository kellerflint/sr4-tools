import StepCard from './StepCard.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import { RANGES } from '../../data/ranges.js';

export default function RangeStep({ value, onChange }) {
  return (
    <StepCard index={1} title="Range" hint="Distance to target.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RANGES.map((r) => (
          <ChoiceButton
            key={r.id}
            active={value === r.id}
            onClick={() => onChange(r.id)}
            sub={r.hint}
            mod={r.mod}
            testId={`range-${r.id}`}
          >
            {r.label}
          </ChoiceButton>
        ))}
      </div>
    </StepCard>
  );
}
