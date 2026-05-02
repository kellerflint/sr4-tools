export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <span
        className={`relative inline-block h-5 w-9 rounded-full transition ${
          checked ? 'bg-accent' : 'bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-text">{label}</span>
    </label>
  );
}
