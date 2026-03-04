import clsx from 'clsx';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import type { Granularity, DisplayMode, Horizon } from '@/types';
import { isScenarioModified } from '@/data';

function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            'px-3 py-1 text-xs font-medium transition-colors',
            opt === value
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
            'border-r border-gray-300 dark:border-gray-600 last:border-r-0'
          )}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}

export default function ChartControls() {
  const { granularity, displayMode, horizon, overlayEnabled, activeScenarioParams, monteCarloEnabled } = useAppState();
  const dispatch = useAppDispatch();
  const scenarioActive = isScenarioModified(activeScenarioParams);

  return (
    <div className="flex items-center gap-4 flex-wrap px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Granularity</span>
        <SegmentedButton<Granularity>
          options={['monthly', 'quarterly', 'annual']}
          value={granularity}
          onChange={(g) => dispatch({ type: 'SET_GRANULARITY', granularity: g })}
          labels={{ monthly: 'M', quarterly: 'Q', annual: 'A' }}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Display</span>
        <SegmentedButton<DisplayMode>
          options={['units', 'dollars']}
          value={displayMode}
          onChange={(m) => dispatch({ type: 'SET_DISPLAY_MODE', mode: m })}
          labels={{ units: 'Units', dollars: '$' }}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Horizon</span>
        <SegmentedButton<Horizon>
          options={['2y', '5y', '10y', '20y']}
          value={horizon}
          onChange={(h) => dispatch({ type: 'SET_HORIZON', horizon: h })}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      <label className={clsx('flex items-center gap-2 text-xs', !scenarioActive && 'opacity-50')}>
        <input
          type="checkbox"
          checked={overlayEnabled}
          onChange={() => dispatch({ type: 'TOGGLE_OVERLAY' })}
          disabled={!scenarioActive}
          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-gray-600 dark:text-gray-300 font-medium">Scenario Overlay</span>
        {scenarioActive && overlayEnabled && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-medium">Active</span>
        )}
      </label>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={monteCarloEnabled}
          onChange={() => dispatch({ type: 'TOGGLE_MONTE_CARLO' })}
          className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
        />
        <span className="text-gray-600 dark:text-gray-300 font-medium">Monte Carlo</span>
        {monteCarloEnabled && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 font-medium">50 paths</span>
        )}
      </label>
    </div>
  );
}
