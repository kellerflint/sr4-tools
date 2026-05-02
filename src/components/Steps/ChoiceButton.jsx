export default function ChoiceButton({ active, onClick, children, sub, mod }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition ${
        active
          ? 'border-accent bg-accent/10 text-text'
          : 'border-border bg-surface-2 text-text hover:border-accent/60'
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-medium">{children}</span>
        {mod !== undefined && mod !== 0 && (
          <span
            className={`text-xs font-semibold ${
              mod > 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {mod > 0 ? `+${mod}` : mod}
          </span>
        )}
      </span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </button>
  );
}
