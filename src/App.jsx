import { useShootingState, buildBreakdown, buildDamage } from './hooks/useShootingState.js';
import { RANGES } from './data/ranges.js';
import StatsPanel from './components/Stats/StatsPanel.jsx';
import RangeStep from './components/Steps/RangeStep.jsx';
import FiringModeStep from './components/Steps/FiringModeStep.jsx';
import ModifiersStep from './components/Steps/ModifiersStep.jsx';
import AimStep from './components/Steps/AimStep.jsx';
import EdgeStep from './components/Steps/EdgeStep.jsx';
import RollStep from './components/Steps/RollStep.jsx';
import DamageStep from './components/Steps/DamageStep.jsx';
import Summary from './components/Summary/Summary.jsx';

export default function App() {
  const {
    stats,
    shot,
    woundMod,
    lastRollHits,
    updateStats,
    updateShot,
    setExclusiveModifier,
    toggleModifier,
    updateCustomMod,
    recordRoll,
    resetShot,
  } = useShootingState();

  const breakdown = buildBreakdown(stats, shot, woundMod, RANGES);
  const damage = buildDamage(stats, shot);
  const ruleOfSix = shot.edgeMode === 'pushTheLimit' && shot.edgeSpend > 0;

  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-text">
            <span className="text-accent">SR4</span> Shooting Helper
          </h1>
          <p className="text-xs text-muted">
            Walk through a firearms attack — set stats, pick range and mode, layer
            modifiers, roll, then read off damage.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <StatsPanel stats={stats} onChange={updateStats} woundMod={woundMod} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <RangeStep
              value={shot.rangeId}
              onChange={(rangeId) => updateShot({ rangeId })}
            />
            <FiringModeStep
              value={shot.firingModeId}
              onChange={(firingModeId) => updateShot({ firingModeId })}
              recoilComp={stats.recoilComp}
            />
            <ModifiersStep
              modifiers={shot.modifiers}
              customMod={shot.customMod}
              onSelectExclusive={setExclusiveModifier}
              onToggle={toggleModifier}
              onChangeCustom={updateCustomMod}
            />
            <AimStep
              value={shot.aimActions}
              onChange={(aimActions) => updateShot({ aimActions })}
            />
            <EdgeStep
              edgeMode={shot.edgeMode}
              edgeSpend={shot.edgeSpend}
              edgeAvailable={stats.edge}
              onChangeMode={(edgeMode) => updateShot({ edgeMode, edgeSpend: 0 })}
              onChangeSpend={(edgeSpend) => updateShot({ edgeSpend })}
            />
            <RollStep
              dicePool={breakdown.dicePool}
              ruleOfSix={ruleOfSix}
              onReset={resetShot}
              onRolled={recordRoll}
            />
            <DamageStep
              shot={shot}
              damage={damage}
              lastRollHits={lastRollHits}
              onChangeAmmo={(ammoId) => updateShot({ ammoId })}
              onChangeNetHits={(netHits) => updateShot({ netHits })}
              onChangeNetHitsMode={(netHitsMode) => updateShot({ netHitsMode })}
              onChangeYourHits={(yourHits) => updateShot({ yourHits })}
              onChangeDefenderHits={(defenderHits) => updateShot({ defenderHits })}
            />
          </div>

          <div>
            <Summary breakdown={breakdown} damage={damage} />
          </div>
        </div>
      </main>
    </div>
  );
}
