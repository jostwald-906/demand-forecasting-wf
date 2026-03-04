import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { isScenarioModified } from '@/data';

export default function ScenarioBanner() {
  const { activeScenarioParams, overlayEnabled } = useAppState();
  const dispatch = useAppDispatch();
  const scenarioActive = isScenarioModified(activeScenarioParams);

  if (!scenarioActive) return null;

  const params = activeScenarioParams;
  const changes: string[] = [];
  if (params.failureRateMultiplier !== 1.0) changes.push(`Failure ${params.failureRateMultiplier.toFixed(1)}x`);
  if (params.utilizationMultiplier !== 1.0) changes.push(`Utilization ${params.utilizationMultiplier.toFixed(1)}x`);
  if (params.leadTimeShockDays !== 0) changes.push(`Lead Time +${params.leadTimeShockDays}d`);
  if (params.capacityCapPercent !== 100) changes.push(`Capacity ${params.capacityCapPercent}%`);
  if (params.seasonalityStrength !== 1.0) changes.push(`Seasonality ${params.seasonalityStrength.toFixed(1)}x`);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Scenario Active
            {!overlayEnabled && (
              <span className="font-normal text-amber-700 dark:text-amber-400 ml-2">(overlay hidden)</span>
            )}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
            All panels reflect modified parameters: {changes.join(' / ')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_OVERLAY' })}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50"
        >
          {overlayEnabled ? 'Hide Overlay' : 'Show Overlay'}
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET_SCENARIO' })}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to Baseline
        </button>
      </div>
    </div>
  );
}
