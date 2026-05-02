import StepCard from './StepCard.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import NumberStepper from '../common/NumberStepper.jsx';

const EDGE_MODES = [
  { id: 'none', label: 'No Edge', sub: 'Standard roll.' },
  { id: 'add', label: 'Add Edge dice', sub: 'Spend Edge to add that many dice.' },
  {
    id: 'pushTheLimit',
    label: 'Push the Limit',
    sub: 'Add Edge dice + Rule of Six (exploding 6s).',
  },
  { id: 'reroll', label: 'Reroll Failures', sub: 'After roll: spend 1 Edge to reroll non-hits.' },
];

export default function EdgeStep({ edgeMode, edgeSpend, onChangeMode, onChangeSpend, edgeAvailable }) {
  return (
    <StepCard
      index={5}
      title="Edge"
      hint={`${edgeAvailable} available`}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EDGE_MODES.map((m) => (
          <ChoiceButton
            key={m.id}
            active={edgeMode === m.id}
            onClick={() => onChangeMode(m.id)}
            sub={m.sub}
          >
            {m.label}
          </ChoiceButton>
        ))}
      </div>

      {(edgeMode === 'add' || edgeMode === 'pushTheLimit') && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-muted">Edge to spend:</span>
          <NumberStepper
            value={edgeSpend}
            onChange={onChangeSpend}
            min={0}
            max={edgeAvailable}
          />
        </div>
      )}
    </StepCard>
  );
}
