import StepCard from './StepCard.jsx';
import ModifierGroup from './ModifierGroup.jsx';
import CustomModifier from './CustomModifier.jsx';
import { MODIFIER_GROUPS } from '../../data/modifiers.js';

export default function ModifiersStep({
  modifiers,
  customMod,
  onSelectExclusive,
  onToggle,
  onChangeCustom,
}) {
  return (
    <StepCard index={3} title="Situational Modifiers" hint="Tap to apply.">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {MODIFIER_GROUPS.map((g) => (
          <ModifierGroup
            key={g.id}
            group={g}
            selectedExclusiveId={modifiers[g.id]}
            toggledMap={modifiers}
            onSelectExclusive={onSelectExclusive}
            onToggle={onToggle}
          />
        ))}
        <div className="lg:col-span-2">
          <CustomModifier value={customMod} onChange={onChangeCustom} />
        </div>
      </div>
    </StepCard>
  );
}
