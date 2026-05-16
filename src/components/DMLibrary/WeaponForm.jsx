import { useState } from 'react';
import NumberStepper from '../common/NumberStepper.jsx';
import Toggle from '../common/Toggle.jsx';
import { DEFAULT_WEAPON, FIRE_MODE_OPTIONS } from '../../data/weaponDefaults.js';

function SegmentedToggle({ value, options, onChange, testIdPrefix }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border bg-surface">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          data-testid={`${testIdPrefix}-${opt.value}`}
          data-active={value === opt.value ? 'true' : 'false'}
          className={`px-3 py-1.5 text-sm transition ${
            value === opt.value
              ? 'bg-accent text-accent-fg'
              : 'text-muted hover:text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function WeaponForm({ initialValue, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_WEAPON,
    ...(initialValue || {}),
  }));

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const isRanged = draft.kind === 'ranged';

  const toggleMode = (modeId) => {
    setDraft((d) => ({
      ...d,
      modes: d.modes.includes(modeId)
        ? d.modes.filter((m) => m !== modeId)
        : [...d.modes, modeId],
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <form
      onSubmit={submit}
      data-testid="weapon-form"
      className="rounded-lg border border-accent bg-surface p-4 space-y-4"
    >
      <Field label="Name">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => set('name')(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Heavy Pistol, Katana"
          data-testid="weapon-name-input"
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Kind">
          <SegmentedToggle
            value={draft.kind}
            onChange={set('kind')}
            options={[
              { value: 'ranged', label: 'Ranged' },
              { value: 'melee', label: 'Melee' },
            ]}
            testIdPrefix="weapon-kind"
          />
        </Field>

        <Field label="Damage Type">
          <SegmentedToggle
            value={draft.damageType}
            onChange={set('damageType')}
            options={[
              { value: 'P', label: 'Physical' },
              { value: 'S', label: 'Stun' },
            ]}
            testIdPrefix="weapon-damage-type"
          />
        </Field>

        <Field label="Base DV">
          <NumberStepper
            value={draft.dv}
            onChange={set('dv')}
            min={0}
            max={20}
            testId="weapon-dv"
          />
        </Field>

        <Field label="Base AP">
          <NumberStepper
            value={draft.ap}
            onChange={set('ap')}
            min={-10}
            max={10}
            testId="weapon-ap"
          />
        </Field>
      </div>

      {isRanged && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="weapon-ranged-fields">
          <Field label="Available Firing Modes">
            <div className="flex flex-wrap gap-2">
              {FIRE_MODE_OPTIONS.map((m) => {
                const active = draft.modes.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMode(m.id)}
                    data-testid={`weapon-mode-${m.id}`}
                    data-active={active ? 'true' : 'false'}
                    className={`rounded-md border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-accent bg-accent/10 text-text'
                        : 'border-border bg-surface-2 text-muted hover:text-text'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Recoil Comp">
            <NumberStepper
              value={draft.rc}
              onChange={set('rc')}
              min={0}
              max={20}
              testId="weapon-rc"
            />
          </Field>

          <div className="flex items-center gap-6 sm:col-span-2">
            <Toggle
              checked={draft.hasSmartlink}
              onChange={set('hasSmartlink')}
              label="Smartlink (+2)"
              testId="weapon-smartlink-toggle"
            />
            <Toggle
              checked={draft.hasLaser}
              onChange={set('hasLaser')}
              label="Laser sight (+1)"
              testId="weapon-laser-toggle"
            />
          </div>
        </div>
      )}

      {!isRanged && (
        <div data-testid="weapon-melee-fields">
          <Field label="Reach">
            <NumberStepper
              value={draft.reach}
              onChange={set('reach')}
              min={0}
              max={3}
              testId="weapon-reach"
            />
          </Field>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCancel}
          data-testid="weapon-cancel"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!draft.name.trim()}
          data-testid="weapon-save"
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </form>
  );
}
