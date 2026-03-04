import { useEffect, useCallback, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { isScenarioModified } from '@/data';
import type { ScenarioParams, ScenarioOutputs } from '@/types';
import {
  applyScenarioToRisk,
  applyScenarioToRecommendations,
  computeScenarioOutputs,
  getRiskData,
  getBaselineRecommendations,
} from '@/data';

interface SliderConfig {
  key: keyof ScenarioParams;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'failureRateMultiplier', label: 'Failure Rate', description: 'Scales demand from component failures', min: 0.5, max: 3.0, step: 0.1, format: (v) => `${v.toFixed(1)}x` },
  { key: 'utilizationMultiplier', label: 'Utilization', description: 'Adjusts demand from operational tempo', min: 0.5, max: 2.0, step: 0.1, format: (v) => `${v.toFixed(1)}x` },
  { key: 'leadTimeShockDays', label: 'Lead Time Shock', description: 'Additional days of supplier delay', min: 0, max: 180, step: 5, format: (v) => `${v}d` },
  { key: 'capacityCapPercent', label: 'Capacity Cap', description: 'Maximum supplier output as % of normal', min: 0, max: 100, step: 5, format: (v) => `${v}%` },
  { key: 'seasonalityStrength', label: 'Seasonality', description: 'Amplifies seasonal demand patterns', min: 0, max: 2.0, step: 0.1, format: (v) => `${v.toFixed(1)}x` },
];

export default function ScenarioDrawer() {
  const { drawerOpen, scenarioParams, activeScenarioParams, selectedNiinId } = useAppState();
  const dispatch = useAppDispatch();

  const close = useCallback(() => {
    dispatch({ type: 'TOGGLE_DRAWER' });
  }, [dispatch]);

  // Escape to close
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [drawerOpen, close]);

  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(scenarioParams) !== JSON.stringify(activeScenarioParams);
  }, [scenarioParams, activeScenarioParams]);

  // Compute live preview outputs using pending params
  const previewOutputs: ScenarioOutputs | null = useMemo(() => {
    if (!selectedNiinId) return null;
    const baselineRisk = getRiskData(selectedNiinId);
    const baselineRecs = getBaselineRecommendations(selectedNiinId);
    if (!baselineRisk) return null;

    const scenarioRisk = applyScenarioToRisk(baselineRisk, scenarioParams);
    const scenarioRecs = applyScenarioToRecommendations(baselineRecs, scenarioParams);
    return computeScenarioOutputs(baselineRisk, scenarioRisk, baselineRecs, scenarioRecs);
  }, [selectedNiinId, scenarioParams]);

  if (!drawerOpen) return null;

  return (
    <>
      {/* No backdrop - drawer coexists with page */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Scenario Builder</h2>
            {hasPendingChanges && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <AlertCircle className="w-3 h-3" /> Pending
              </span>
            )}
          </div>
          <button onClick={close} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</label>
                <span className="text-sm font-mono font-semibold text-primary-700 dark:text-primary-400">
                  {s.format(scenarioParams[s.key])}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{s.description}</p>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={scenarioParams[s.key]}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_SCENARIO_PARAM',
                    key: s.key,
                    value: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                <span>{s.format(s.min)}</span>
                <span>{s.format(s.max)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky footer: outputs + buttons */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-5 py-4 shrink-0 space-y-3">
          {/* Scenario outputs */}
          {previewOutputs && isScenarioModified(scenarioParams) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <OutputTile
                label="Stockout 90d"
                value={`${previewOutputs.scenarioStockoutProb90d}%`}
                delta={previewOutputs.scenarioStockoutProb90d - previewOutputs.baselineStockoutProb90d}
                suffix="pp"
                invertColor
              />
              <OutputTile
                label="Delta Spend"
                value={`$${Math.abs(previewOutputs.deltaSpend).toLocaleString()}`}
                delta={previewOutputs.deltaSpend}
                prefix="$"
                invertColor
              />
              <OutputTile
                label="Service Level"
                value={`${previewOutputs.deltaServiceLevel > 0 ? '+' : ''}${previewOutputs.deltaServiceLevel.toFixed(1)}pp`}
                delta={previewOutputs.deltaServiceLevel}
                suffix="pp"
              />
              <OutputTile
                label="Buy Qty Delta"
                value={`${previewOutputs.deltaRecommendedBuyQty > 0 ? '+' : ''}${previewOutputs.deltaRecommendedBuyQty}`}
                delta={-previewOutputs.deltaRecommendedBuyQty}
                suffix=" units"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'APPLY_SCENARIO' })}
              disabled={!hasPendingChanges}
              className={clsx(
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
                hasPendingChanges
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              )}
            >
              Apply Scenario
            </button>
            <button
              onClick={() => dispatch({ type: 'RESET_SCENARIO' })}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function OutputTile({
  label,
  value,
  delta,
  prefix: _prefix,
  suffix: _suffix,
  invertColor = false,
}: {
  label: string;
  value: string;
  delta: number;
  prefix?: string;
  suffix?: string;
  invertColor?: boolean;
}) {
  const isPositive = delta > 0;
  const colorClass = invertColor
    ? (isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')
    : (isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-2">
      <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
      <p className={clsx('text-sm font-semibold', Math.abs(delta) < 0.5 ? 'text-gray-700 dark:text-gray-300' : colorClass)}>
        {value}
      </p>
    </div>
  );
}
