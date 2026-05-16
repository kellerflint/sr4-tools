import { useState } from 'react';
import NumberStepper from '../common/NumberStepper.jsx';
import {
  ATTRIBUTES,
  SKILLS,
  DEFAULT_CHARACTER,
} from '../../data/characterDefaults.js';

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

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h4>
      {children}
    </div>
  );
}

function WeaponAttachList({ weapons, attachedIds, onToggle }) {
  if (weapons.length === 0) {
    return (
      <p className="text-sm text-muted">
        No weapons in the library yet — create some on the Weapons tab to attach them here.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="character-weapon-attach">
      {weapons.map((w) => {
        const active = attachedIds.includes(w.id);
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onToggle(w.id)}
            data-testid="weapon-attach-option"
            data-active={active ? 'true' : 'false'}
            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
              active
                ? 'border-accent bg-accent/10 text-text'
                : 'border-border bg-surface-2 text-muted hover:text-text'
            }`}
          >
            <div className="font-medium" data-testid="weapon-attach-name">
              {w.name}
            </div>
            <div className="text-xs text-muted">
              {w.kind} · DV {w.dv}
              {w.damageType}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function CharacterForm({ initialValue, weapons, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_CHARACTER,
    ...(initialValue || {}),
    attributes: { ...DEFAULT_CHARACTER.attributes, ...(initialValue?.attributes || {}) },
    skills: { ...DEFAULT_CHARACTER.skills, ...(initialValue?.skills || {}) },
    weaponIds: initialValue?.weaponIds ? [...initialValue.weaponIds] : [],
  }));

  const setField = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const setAttr = (id) => (value) =>
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [id]: value } }));
  const setSkill = (id) => (value) =>
    setDraft((d) => ({ ...d, skills: { ...d.skills, [id]: value } }));
  const toggleWeapon = (id) =>
    setDraft((d) => ({
      ...d,
      weaponIds: d.weaponIds.includes(id)
        ? d.weaponIds.filter((wId) => wId !== id)
        : [...d.weaponIds, id],
    }));

  const submit = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <form
      onSubmit={submit}
      data-testid="character-form"
      className="rounded-lg border border-accent bg-surface p-4 space-y-5"
    >
      <Field label="Name">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setField('name')(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Sam, Goon-3"
          data-testid="character-name-input"
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </Field>

      <Section title="Attributes">
        <div className="grid grid-cols-3 gap-3">
          {ATTRIBUTES.map((a) => (
            <Field key={a.id} label={a.label}>
              <NumberStepper
                value={draft.attributes[a.id]}
                onChange={setAttr(a.id)}
                min={1}
                max={9}
                testId={`character-attr-${a.id}`}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Combat Skills">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SKILLS.map((s) => (
            <Field key={s.id} label={s.label}>
              <NumberStepper
                value={draft.skills[s.id]}
                onChange={setSkill(s.id)}
                min={0}
                max={9}
                testId={`character-skill-${s.id}`}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Combat Profile">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Initiative Passes">
            <NumberStepper
              value={draft.ipMax}
              onChange={setField('ipMax')}
              min={1}
              max={4}
              testId="character-ip"
            />
          </Field>
          <Field label="Armor (Ballistic)">
            <NumberStepper
              value={draft.armorB}
              onChange={setField('armorB')}
              min={0}
              max={20}
              testId="character-armor-b"
            />
          </Field>
          <Field label="Armor (Impact)">
            <NumberStepper
              value={draft.armorI}
              onChange={setField('armorI')}
              min={0}
              max={20}
              testId="character-armor-i"
            />
          </Field>
        </div>
      </Section>

      <Section title="Weapons">
        <WeaponAttachList
          weapons={weapons}
          attachedIds={draft.weaponIds}
          onToggle={toggleWeapon}
        />
      </Section>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCancel}
          data-testid="character-cancel"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!draft.name.trim()}
          data-testid="character-save"
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </form>
  );
}
