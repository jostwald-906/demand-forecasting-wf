import { useMemo } from 'react';
import { Plane, Gauge, Target, Clock } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { isScenarioModified } from '@/data';
import type { RiskData, OperationalData, NiinRecord } from '@/types';

interface ReadinessImpactProps {
  risk: RiskData;
  baselineRisk: RiskData;
  operational: OperationalData;
  niin: NiinRecord;
}

interface ReadinessTile {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'better' | 'worse' | 'neutral';
  icon: typeof Plane;
  tooltip: string;
}

function computeReadiness(
  risk: RiskData,
  operational: OperationalData,
  niin: NiinRecord
) {
  // Aircraft at Risk: backorders directly ground aircraft; projected shortfalls add more
  // Each backorder on a critical part grounds 1 aircraft; non-critical may share across fleet
  const backoderImpact = niin.criticalityFlag ? operational.backorders : Math.ceil(operational.backorders * 0.5);
  const projectedShortfalls = Math.round((risk.stockoutProb90d / 100) * (operational.demand90d / 3)); // next 30 days
  const aircraftAtRisk = backoderImpact + Math.round(projectedShortfalls * (niin.criticalityFlag ? 0.8 : 0.3));

  // MC Rate Impact: service level gap is the direct readiness measure
  // DoD standard: 1pp service level gap ~= 0.3-0.8pp MC rate impact depending on criticality
  const serviceGap = Math.max(0, risk.serviceLevelPolicy - risk.serviceLevelActual);
  const criticalityMultiplier = niin.criticalityFlag ? 0.7 : 0.3;
  const mcRateImpact = Math.round(serviceGap * criticalityMultiplier * 10) / 10;

  // Sorties at Risk (30d): based on backorders + projected demand shortfalls
  // Critical parts: 1 backorder = ~2 sorties lost; non-critical: less impact
  const sortiesPerBackorder = niin.criticalityFlag ? 2 : 0.5;
  const dailyDemand = operational.demand90d / 90;
  const projectedStockoutDays = 30 * (risk.stockoutProb90d / 100);
  const sortiesAtRisk = Math.round(
    operational.backorders * sortiesPerBackorder +
    dailyDemand * projectedStockoutDays * (niin.criticalityFlag ? 1.5 : 0.5)
  );

  // NMCS Hours: Not Mission Capable Supply
  // Each active backorder contributes ~24-72 hrs NMCS depending on repair cycle
  const avgRepairHours = Math.min(72, niin.leadTimeDays * 0.3);
  const nmcsHours = Math.round(
    operational.backorders * avgRepairHours +
    projectedStockoutDays * dailyDemand * 24 // projected future NMCS
  );

  return { aircraftAtRisk, mcRateImpact, sortiesAtRisk, nmcsHours };
}

export default function ReadinessImpact({ risk, baselineRisk, operational, niin }: ReadinessImpactProps) {
  const { activeScenarioParams } = useAppState();
  const scenarioActive = isScenarioModified(activeScenarioParams);

  const current = useMemo(() => computeReadiness(risk, operational, niin), [risk, operational, niin]);
  const baseline = useMemo(() => computeReadiness(baselineRisk, operational, niin), [baselineRisk, operational, niin]);

  const tiles: ReadinessTile[] = useMemo(() => {
    const deltaAircraft = scenarioActive ? current.aircraftAtRisk - baseline.aircraftAtRisk : undefined;
    const deltaMC = scenarioActive ? current.mcRateImpact - baseline.mcRateImpact : undefined;
    const deltaSorties = scenarioActive ? current.sortiesAtRisk - baseline.sortiesAtRisk : undefined;
    const deltaNMCS = scenarioActive ? current.nmcsHours - baseline.nmcsHours : undefined;

    return [
      {
        label: 'Aircraft at Risk',
        value: current.aircraftAtRisk.toString(),
        delta: deltaAircraft !== undefined ? `${deltaAircraft > 0 ? '+' : ''}${deltaAircraft}` : undefined,
        deltaDirection: deltaAircraft !== undefined ? (deltaAircraft > 0 ? 'worse' : deltaAircraft < 0 ? 'better' : 'neutral') : undefined,
        icon: Plane,
        tooltip: 'Aircraft potentially grounded due to part unavailability',
      },
      {
        label: 'MC Rate Impact',
        value: `-${current.mcRateImpact}pp`,
        delta: deltaMC !== undefined ? `${deltaMC > 0 ? '+' : ''}${deltaMC.toFixed(1)}pp` : undefined,
        deltaDirection: deltaMC !== undefined ? (deltaMC > 0 ? 'worse' : deltaMC < 0 ? 'better' : 'neutral') : undefined,
        icon: Gauge,
        tooltip: 'Mission-capable rate reduction from supply shortfalls',
      },
      {
        label: 'Sorties at Risk (30d)',
        value: current.sortiesAtRisk.toLocaleString(),
        delta: deltaSorties !== undefined ? `${deltaSorties > 0 ? '+' : ''}${deltaSorties}` : undefined,
        deltaDirection: deltaSorties !== undefined ? (deltaSorties > 0 ? 'worse' : deltaSorties < 0 ? 'better' : 'neutral') : undefined,
        icon: Target,
        tooltip: 'Projected sortie cancellations in next 30 days due to part shortage',
      },
      {
        label: 'NMCS Hours Projected',
        value: current.nmcsHours.toLocaleString(),
        delta: deltaNMCS !== undefined ? `${deltaNMCS > 0 ? '+' : ''}${deltaNMCS}` : undefined,
        deltaDirection: deltaNMCS !== undefined ? (deltaNMCS > 0 ? 'worse' : deltaNMCS < 0 ? 'better' : 'neutral') : undefined,
        icon: Clock,
        tooltip: 'Not Mission Capable Supply hours projected over 90 days',
      },
    ];
  }, [current, baseline, scenarioActive]);

  const overallSeverity = current.aircraftAtRisk > 5 || current.mcRateImpact > 5 ? 'critical' : current.aircraftAtRisk > 0 ? 'warning' : 'nominal';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Readiness Impact
          </h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
            overallSeverity === 'critical'
              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
              : overallSeverity === 'warning'
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
          }`}>
            {overallSeverity === 'critical' ? 'Mission Risk' : overallSeverity === 'warning' ? 'Watch' : 'Nominal'}
          </span>
        </div>
        {scenarioActive && (
          <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">Scenario-adjusted</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 p-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const isElevated = tile.label === 'Aircraft at Risk' ? current.aircraftAtRisk > 3
            : tile.label === 'MC Rate Impact' ? current.mcRateImpact > 3
            : tile.label === 'Sorties at Risk (30d)' ? current.sortiesAtRisk > 10
            : current.nmcsHours > 200;

          return (
            <div
              key={tile.label}
              className={`relative rounded-lg border p-3 group ${
                isElevated
                  ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/50'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
              title={tile.tooltip}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${isElevated ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                  {tile.label}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className={`text-xl font-bold ${
                  isElevated ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {tile.value}
                </span>
                {tile.delta && tile.delta !== '+0' && tile.delta !== '+0.0pp' && (
                  <span className={`text-xs font-medium mb-0.5 ${
                    tile.deltaDirection === 'worse'
                      ? 'text-red-600 dark:text-red-400'
                      : tile.deltaDirection === 'better'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {tile.delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
