import { useShootingState, buildBreakdown, buildDamage } from '../hooks/useShootingState.js';
import { RANGES } from '../data/ranges.js';
import StatsPanel from '../components/Stats/StatsPanel.jsx';
import RangeStep from '../components/Steps/RangeStep.jsx';
import FiringModeStep from '../components/Steps/FiringModeStep.jsx';
import ModifiersStep from '../components/Steps/ModifiersStep.jsx';
import AimStep from '../components/Steps/AimStep.jsx';
import EdgeStep from '../components/Steps/EdgeStep.jsx';
import RollStep from '../components/Steps/RollStep.jsx';
import DamageStep from '../components/Steps/DamageStep.jsx';
import Summary from '../components/Summary/Summary.jsx';

export default function PlayerPage() {
  const {
    stats,
    shot,
    woundMod,
    lastRoll,
    updateStats,
    updateShot,
    setExclusiveModifier,
    toggleModifier,
    updateCustomMod,
    recordRoll,
    clearRoll,
    resetShot,
  } = useShootingState();

  const breakdown = buildBreakdown(stats, shot, woundMod, RANGES);
  const damage = buildDamage(stats, shot);
  const ruleOfSix = shot.edgeMode === 'pushTheLimit' && shot.edgeSpend > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6" data-testid="page-player">
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
            result={lastRoll}
            onRolled={recordRoll}
            onClearRoll={clearRoll}
          />
          <DamageStep
            shot={shot}
            damage={damage}
            lastRollHits={lastRoll ? lastRoll.hits : null}
            onChangeAmmo={(ammoId) => updateShot({ ammoId })}
            onChangeNetHits={(netHits) => updateShot({ netHits })}
            onChangeNetHitsMode={(netHitsMode) => updateShot({ netHitsMode })}
            onChangeYourHits={(yourHits) => updateShot({ yourHits })}
            onChangeDefenderHits={(defenderHits) => updateShot({ defenderHits })}
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={resetShot}
              data-testid="reset-shot"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:border-danger hover:text-danger"
            >
              Reset shot
            </button>
          </div>
        </div>

        <div>
          <Summary breakdown={breakdown} damage={damage} />
        </div>
      </div>
    </main>
  );
}
