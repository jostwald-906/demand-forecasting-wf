import { useAppDispatch, useAppState } from '@/context/AppContext';
import { isScenarioModified } from '@/data';
import type { ScenarioParams } from '@/types';
import { DEFAULT_SCENARIO_PARAMS } from '@/types';

interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  params: ScenarioParams;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    description: 'Default parameters - no adjustments',
    params: DEFAULT_SCENARIO_PARAMS,
  },
  {
    id: 'high-demand',
    label: 'High Demand',
    description: 'Increased failure rate and utilization',
    params: { failureRateMultiplier: 1.8, utilizationMultiplier: 1.5, leadTimeShockDays: 0, capacityCapPercent: 100, seasonalityStrength: 1.0 },
  },
  {
    id: 'supply-disruption',
    label: 'Supply Disruption',
    description: 'Lead time shock with reduced capacity',
    params: { failureRateMultiplier: 1.0, utilizationMultiplier: 1.0, leadTimeShockDays: 90, capacityCapPercent: 60, seasonalityStrength: 1.0 },
  },
  {
    id: 'worst-case',
    label: 'Worst Case',
    description: 'High demand + supply disruption combined',
    params: { failureRateMultiplier: 2.0, utilizationMultiplier: 1.5, leadTimeShockDays: 120, capacityCapPercent: 50, seasonalityStrength: 1.5 },
  },
  {
    id: 'best-case',
    label: 'Best Case',
    description: 'Reduced demand, full capacity',
    params: { failureRateMultiplier: 0.7, utilizationMultiplier: 0.8, leadTimeShockDays: 0, capacityCapPercent: 100, seasonalityStrength: 0.5 },
  },
];

function matchesPreset(current: ScenarioParams, preset: ScenarioParams): boolean {
  return (
    current.failureRateMultiplier === preset.failureRateMultiplier &&
    current.utilizationMultiplier === preset.utilizationMultiplier &&
    current.leadTimeShockDays === preset.leadTimeShockDays &&
    current.capacityCapPercent === preset.capacityCapPercent &&
    current.seasonalityStrength === preset.seasonalityStrength
  );
}

export default function ScenarioPresets() {
  const { activeScenarioParams } = useAppState();
  const dispatch = useAppDispatch();

  const currentPresetId = PRESETS.find((p) => matchesPreset(activeScenarioParams, p.params))?.id ?? 'custom';
  const modified = isScenarioModified(activeScenarioParams);

  const handleSelect = (preset: ScenarioPreset) => {
    // Set all slider values then apply
    for (const [key, value] of Object.entries(preset.params)) {
      dispatch({ type: 'SET_SCENARIO_PARAM', key: key as keyof ScenarioParams, value: value as number });
    }
    dispatch({ type: 'APPLY_SCENARIO' });
  };

  return (
    <select
      value={currentPresetId}
      onChange={(e) => {
        const preset = PRESETS.find((p) => p.id === e.target.value);
        if (preset) handleSelect(preset);
      }}
      className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
      title="Select a scenario preset"
    >
      {PRESETS.map((p) => (
        <option key={p.id} value={p.id}>{p.label}</option>
      ))}
      {currentPresetId === 'custom' && modified && (
        <option value="custom" disabled>Custom</option>
      )}
    </select>
  );
}
