import StatField from './StatField.jsx';
import Toggle from '../common/Toggle.jsx';
import WeaponFields from './WeaponFields.jsx';

export default function StatsPanel({ stats, onChange, woundMod }) {
  const set = (key) => (value) => onChange({ [key]: value });

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Character & Weapon
        </h2>
        <span className="text-xs text-muted">Persistent across shots</span>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatField
          label="Agility"
          value={stats.agility}
          onChange={set('agility')}
          min={1}
          max={12}
          testId="stat-agility"
        />
        <StatField
          label="Firearms Skill"
          value={stats.firearmsSkill}
          onChange={set('firearmsSkill')}
          min={0}
          max={12}
          testId="stat-firearms"
        />
        <StatField
          label="Recoil Comp"
          value={stats.recoilComp}
          onChange={set('recoilComp')}
          min={0}
          max={20}
          hint="Total RC from weapon + accessories."
          testId="stat-recoil-comp"
        />
        <StatField
          label="Edge"
          value={stats.edge}
          onChange={set('edge')}
          min={0}
          max={9}
        />
        <StatField
          label="Physical Boxes"
          value={stats.physicalDamage}
          onChange={set('physicalDamage')}
          min={0}
          max={20}
          hint="−1 per 3 boxes."
        />
        <StatField
          label="Stun Boxes"
          value={stats.stunDamage}
          onChange={set('stunDamage')}
          min={0}
          max={20}
          hint="−1 per 3 boxes."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
        <Toggle
          checked={stats.smartlink}
          onChange={(v) => onChange({ smartlink: v })}
          label="Smartlink (+2)"
          testId="toggle-smartlink"
        />
        <Toggle
          checked={stats.laserSight}
          onChange={(v) => onChange({ laserSight: v })}
          label="Laser sight (+1)"
          testId="toggle-laser"
        />
        {woundMod !== 0 && (
          <span className="ml-auto rounded bg-surface-2 px-2 py-1 text-xs text-danger">
            Wound modifier: {woundMod}
          </span>
        )}
      </div>

      <div className="mt-4">
        <WeaponFields stats={stats} onChange={onChange} />
      </div>
    </section>
  );
}
