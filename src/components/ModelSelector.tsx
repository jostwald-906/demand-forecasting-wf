import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Cpu, Eye, EyeOff } from 'lucide-react';
import { getModelsForNiin } from '@/data/mockModels';

interface ModelSelectorProps {
  niinId: string;
  onToggleModel?: (modelId: string, enabled: boolean) => void;
  enabledModels?: Set<string>;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 18;
  const w = 56;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function ModelSelector({ niinId, onToggleModel, enabledModels }: ModelSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const models = useMemo(() => getModelsForNiin(niinId), [niinId]);

  const topTwo = models.slice(0, 2);

  return (
    <div className="relative">
      {/* Chip */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <Cpu className="w-3 h-3 text-primary-500" />
        <span className="hidden sm:inline">Ensemble:</span>
        <span className="text-primary-600 dark:text-primary-400">{topTwo[0]?.name} + {topTwo[1]?.name}</span>
        <span className="text-gray-400 dark:text-gray-500">({topTwo[0]?.weight}/{topTwo[1]?.weight})</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Dropdown */}
      {expanded && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-30 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Model Ensemble
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              Weighted combination of {models.length} forecasting models
            </p>
          </div>

          <div className="p-2 space-y-1">
            {models.map((model) => {
              const isEnabled = enabledModels ? enabledModels.has(model.id) : true;
              return (
                <div
                  key={model.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isEnabled ? 'bg-gray-50 dark:bg-gray-700/50' : 'opacity-50'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{model.name}</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">{model.type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-[10px] font-mono ${model.mape <= 10 ? 'text-green-600 dark:text-green-400' : model.mape <= 16 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        MAPE {model.mape}%
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                        Wt: {model.weight}%
                      </span>
                    </div>
                  </div>
                  <MiniSparkline data={model.sparkline} color={model.color} />
                  {onToggleModel && (
                    <button
                      onClick={() => onToggleModel(model.id, !isEnabled)}
                      className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      title={isEnabled ? 'Hide model overlay' : 'Show model overlay'}
                    >
                      {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Weight distribution bar */}
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex h-2 rounded-full overflow-hidden">
              {models.map((model) => (
                <div key={model.id} style={{ width: `${model.weight}%`, backgroundColor: model.color }} title={`${model.name}: ${model.weight}%`} />
              ))}
            </div>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 text-center">
              Ensemble weight distribution — auto-tuned weekly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
