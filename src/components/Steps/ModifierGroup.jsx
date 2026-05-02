import ChoiceButton from './ChoiceButton.jsx';

export default function ModifierGroup({
  group,
  selectedExclusiveId,
  toggledMap,
  onSelectExclusive,
  onToggle,
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {group.title}
      </h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {group.options.map((opt) => {
          const active = group.exclusive
            ? selectedExclusiveId === opt.id
            : !!toggledMap[opt.id];
          return (
            <ChoiceButton
              key={opt.id}
              active={active}
              onClick={() =>
                group.exclusive ? onSelectExclusive(group.id, opt.id) : onToggle(opt.id)
              }
              mod={opt.mod}
              sub={opt.note}
            >
              {opt.label}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}
