import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import SectionWrapper from './SectionWrapper';

interface Driver {
  name: string;
  contribution: number; // percentage
  enabled: boolean;
  description: string;
}

function getDriversForNiin(niinId: string): Driver[] {
  const seed = niinId.replace('niin-', '');
  const n = parseInt(seed, 10) || 1;
  const s = (n * 17 + 3) % 100;

  // Raw weights — will be normalized to sum to 100%
  const raw = [
    { name: 'Seasonality', weight: 15 + (s % 10), description: 'Seasonal demand patterns from historical usage cycles' },
    { name: 'Utilization Tempo', weight: 25 + ((s * 3) % 15), description: 'Current operational flying hours and deployment rate' },
    { name: 'Failure Rate Trend', weight: 20 + ((s * 7) % 12), description: 'Observed failure rate trend over past 24 months' },
    { name: 'Fleet Age Factor', weight: 10 + ((s * 11) % 8), description: 'Aircraft age increases maintenance frequency' },
    { name: 'Deployment Surge', weight: 5 + ((s * 13) % 10), description: 'Planned deployments and contingency operations' },
  ];

  const totalRaw = raw.reduce((sum, d) => sum + d.weight, 0);
  return raw.map((d) => ({
    name: d.name,
    contribution: Math.round((d.weight / totalRaw) * 100),
    enabled: true,
    description: d.description,
  }));
}

interface ForecastDriversProps {
  niinId: string;
}

export default function ForecastDrivers({ niinId }: ForecastDriversProps) {
  const [expanded, setExpanded] = useState(false);
  const initialDrivers = useMemo(() => getDriversForNiin(niinId), [niinId]);
  const [drivers, setDrivers] = useState(initialDrivers);

  // Reset when niinId changes
  useMemo(() => {
    setDrivers(getDriversForNiin(niinId));
  }, [niinId]);

  const toggleDriver = (index: number) => {
    setDrivers((prev) =>
      prev.map((d, i) => (i === index ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const totalContribution = drivers.filter((d) => d.enabled).reduce((sum, d) => sum + d.contribution, 0);
  const maxContribution = Math.max(...drivers.map((d) => d.contribution));

  return (
    <SectionWrapper
      title="Forecast Drivers"
      headerRight={
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      }
    >
      {!expanded ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {drivers.length} drivers contributing to forecast. Click expand to view and toggle.
        </p>
      ) : (
        <div className="space-y-3">
          {drivers.map((driver, i) => (
            <div key={driver.name} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={driver.enabled}
                onChange={() => toggleDriver(i)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${driver.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                    {driver.name}
                  </span>
                  <span className={`text-xs font-mono ${driver.enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {driver.contribution}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${driver.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    style={{ width: `${(driver.contribution / maxContribution) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{driver.description}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2 text-xs text-gray-500 dark:text-gray-400">
            Active contribution: <span className="font-medium text-gray-700 dark:text-gray-300">{totalContribution}%</span>
            {totalContribution < 80 && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">Disabling drivers may reduce forecast accuracy</span>
            )}
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}
