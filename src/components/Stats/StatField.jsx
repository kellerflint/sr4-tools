import NumberStepper from '../common/NumberStepper.jsx';

export default function StatField({ label, value, onChange, min, max, hint, testId }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      <NumberStepper
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        testId={testId}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
