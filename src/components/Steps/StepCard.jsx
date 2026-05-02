export default function StepCard({ index, title, hint, children, footer }) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <div className="flex items-baseline gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
            {index}
          </span>
          <h3 className="text-base font-semibold text-text">{title}</h3>
        </div>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </header>
      <div className="p-4">{children}</div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </section>
  );
}
