import { useMemo } from 'react';
import { X, ArrowUp, ArrowDown, Minus, Trophy, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import { useSelectedNiinData } from '@/context/AppContext';
import type { ScenarioParams } from '@/types';
import { DEFAULT_SCENARIO_PARAMS } from '@/types';
import {
  applyScenarioToRisk,
  applyScenarioToRecommendations,
} from '@/data';

interface ScenarioComparisonProps {
  open: boolean;
  onClose: () => void;
}

interface NamedScenario {
  name: string;
  params: ScenarioParams;
  color: string;
}

const SCENARIOS: NamedScenario[] = [
  {
    name: 'Baseline',
    params: DEFAULT_SCENARIO_PARAMS,
    color: 'blue',
  },
  {
    name: 'High Demand',
    params: { ...DEFAULT_SCENARIO_PARAMS, failureRateMultiplier: 1.5, utilizationMultiplier: 1.3 },
    color: 'red',
  },
  {
    name: 'Supply Disruption',
    params: { ...DEFAULT_SCENARIO_PARAMS, leadTimeShockDays: 90, capacityCapPercent: 70 },
    color: 'amber',
  },
  {
    name: 'Worst Case',
    params: { failureRateMultiplier: 2.0, utilizationMultiplier: 1.5, leadTimeShockDays: 120, capacityCapPercent: 60, seasonalityStrength: 1.5 },
    color: 'purple',
  },
  {
    name: 'Best Case',
    params: { failureRateMultiplier: 0.8, utilizationMultiplier: 0.9, leadTimeShockDays: 0, capacityCapPercent: 100, seasonalityStrength: 0.7 },
    color: 'green',
  },
];

function DeltaArrow({ delta, inverted = false }: { delta: number; inverted?: boolean }) {
  const isGood = inverted ? delta < 0 : delta > 0;
  const isBad = inverted ? delta > 0 : delta < 0;
  if (Math.abs(delta) < 0.5) return <Minus className="w-3 h-3 text-gray-400" />;
  if (isGood) return <ArrowUp className="w-3 h-3 text-green-500" />;
  if (isBad) return <ArrowDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

export default function ScenarioComparison({ open, onClose }: ScenarioComparisonProps) {
  const data = useSelectedNiinData();

  const comparisons = useMemo(() => {
    if (!data) return [];
    return SCENARIOS.map((scenario) => {
      const risk = applyScenarioToRisk(data.baselineRisk, scenario.params);
      const recs = applyScenarioToRecommendations(data.baselineRecommendations, scenario.params);
      const totalCost = recs.reduce((sum, r) => sum + r.costImpact, 0);
      const totalServiceUplift = recs.reduce((sum, r) => sum + r.serviceUplift, 0);
      return {
        scenario,
        risk,
        totalCost,
        totalServiceUplift,
        actionCount: recs.length,
        topAction: recs.sort((a, b) => b.serviceUplift - a.serviceUplift)[0],
      };
    });
  }, [data]);

  // Determine "winner" — lowest stockout prob with acceptable cost
  const winner = useMemo(() => {
    if (comparisons.length === 0) return null;
    // Best = lowest stockout prob 90d
    return comparisons.reduce((best, c) => c.risk.stockoutProb90d < best.risk.stockoutProb90d ? c : best);
  }, [comparisons]);

  // Find best cost scenario
  const lowestCost = useMemo(() => {
    if (comparisons.length === 0) return null;
    return comparisons.reduce((best, c) => c.totalCost < best.totalCost ? c : best);
  }, [comparisons]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[90vw] max-w-5xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Scenario Comparison</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Course of Action analysis — {data?.niin.nomenclature ?? 'No NIIN selected'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!data ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p>Select a NIIN to compare scenarios</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Synthesis summary */}
            {winner && lowestCost && winner !== lowestCost && (
              <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">Analysis Summary</span>
                </div>
                <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
                  <strong>{winner.scenario.name}</strong> achieves the lowest stockout probability ({winner.risk.stockoutProb90d}%) but costs ${winner.totalCost.toLocaleString()}.
                  <strong> {lowestCost.scenario.name}</strong> is the most cost-effective at ${lowestCost.totalCost.toLocaleString()} but carries {lowestCost.risk.stockoutProb90d}% stockout risk.
                  {winner.totalCost - lowestCost.totalCost > 0 && (
                    <> The risk reduction costs an additional ${(winner.totalCost - lowestCost.totalCost).toLocaleString()} ({Math.round((lowestCost.risk.stockoutProb90d - winner.risk.stockoutProb90d))}pp improvement).</>
                  )}
                </p>
              </div>
            )}

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 w-40">Metric</th>
                    {comparisons.map((c) => (
                      <th key={c.scenario.name} className="text-center py-2 px-3 font-medium text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full bg-${c.scenario.color}-500`} />
                          {c.scenario.name}
                          {winner === c && (
                            <Trophy className="w-3 h-3 text-amber-500" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Stockout Prob 90d */}
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-gray-400" />
                        Stockout Prob (90d)
                      </div>
                    </td>
                    {comparisons.map((c) => {
                      const baseVal = comparisons[0].risk.stockoutProb90d;
                      const delta = c.risk.stockoutProb90d - baseVal;
                      return (
                        <td key={c.scenario.name} className="py-2.5 px-3 text-center">
                          <span className={`text-sm font-bold ${c.risk.stockoutProb90d >= 60 ? 'text-red-600 dark:text-red-400' : c.risk.stockoutProb90d >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            {c.risk.stockoutProb90d}%
                          </span>
                          {delta !== 0 && (
                            <div className="flex items-center justify-center gap-0.5 mt-0.5">
                              <DeltaArrow delta={-delta} />
                              <span className={`text-[10px] ${delta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {delta > 0 ? '+' : ''}{delta}pp
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Service Level */}
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-gray-400" />
                        Service Level
                      </div>
                    </td>
                    {comparisons.map((c) => {
                      const baseVal = comparisons[0].risk.serviceLevelActual;
                      const delta = c.risk.serviceLevelActual - baseVal;
                      return (
                        <td key={c.scenario.name} className="py-2.5 px-3 text-center">
                          <span className={`text-sm font-bold ${c.risk.serviceLevelActual >= 95 ? 'text-green-600 dark:text-green-400' : c.risk.serviceLevelActual >= 85 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {c.risk.serviceLevelActual}%
                          </span>
                          {delta !== 0 && (
                            <div className="flex items-center justify-center gap-0.5 mt-0.5">
                              <DeltaArrow delta={delta} />
                              <span className={`text-[10px] ${delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {delta > 0 ? '+' : ''}{delta}pp
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Total Cost */}
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        Total Action Cost
                      </div>
                    </td>
                    {comparisons.map((c) => {
                      const baseVal = comparisons[0].totalCost;
                      const delta = c.totalCost - baseVal;
                      return (
                        <td key={c.scenario.name} className="py-2.5 px-3 text-center">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            ${(c.totalCost / 1000).toFixed(0)}K
                          </span>
                          {delta !== 0 && (
                            <div className="flex items-center justify-center gap-0.5 mt-0.5">
                              <DeltaArrow delta={-delta} />
                              <span className={`text-[10px] ${delta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {delta > 0 ? '+' : ''}${(delta / 1000).toFixed(0)}K
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Stockout Prob 24mo */}
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">Stockout Prob (24mo)</td>
                    {comparisons.map((c) => (
                      <td key={c.scenario.name} className="py-2.5 px-3 text-center">
                        <span className={`text-sm font-bold ${c.risk.stockoutProb24mo >= 60 ? 'text-red-600 dark:text-red-400' : c.risk.stockoutProb24mo >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                          {c.risk.stockoutProb24mo}%
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* First Projected Stockout */}
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">First Stockout</td>
                    {comparisons.map((c) => (
                      <td key={c.scenario.name} className="py-2.5 px-3 text-center text-xs text-gray-700 dark:text-gray-300">
                        {c.risk.firstProjectedStockout
                          ? new Date(c.risk.firstProjectedStockout).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : <span className="text-green-600 dark:text-green-400 font-medium">None</span>
                        }
                      </td>
                    ))}
                  </tr>

                  {/* Confidence */}
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">Confidence</td>
                    {comparisons.map((c) => (
                      <td key={c.scenario.name} className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          c.risk.confidenceScore === 'High' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                          : c.risk.confidenceScore === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                        }`}>
                          {c.risk.confidenceScore}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Top Action */}
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">Top Action</td>
                    {comparisons.map((c) => (
                      <td key={c.scenario.name} className="py-2.5 px-3 text-center text-xs text-gray-600 dark:text-gray-400">
                        {c.topAction
                          ? <span>{c.topAction.actionType} ({c.topAction.quantity})</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
