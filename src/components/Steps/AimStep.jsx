import StepCard from './StepCard.jsx';
import NumberStepper from '../common/NumberStepper.jsx';
import { DEFAULT_AIM_CAP } from '../../data/modifiers.js';

export default function AimStep({ value, onChange }) {
  return (
    <StepCard
      index={4}
      title="Aim Actions"
      hint="+1 dice per Take Aim simple action."
    >
      <div className="flex items-center gap-3">
        <NumberStepper value={value} onChange={onChange} min={0} max={DEFAULT_AIM_CAP} />
        <span className="text-sm text-muted">
          Bonus: <span className="text-success">+{value}</span>
        </span>
      </div>
    </StepCard>
  );
}
