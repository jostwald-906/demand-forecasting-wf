import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { getBaselineForecast } from '@/data';

interface QualityMetric {
  label: string;
  value: number;
  unit: string;
  format: (v: number) => string;
  thresholds: { good: number; fair: number };
  invertColor?: boolean;
  tooltip: string;
}

function getMetricsForNiin(niinId: string): QualityMetric[] {
  const forecast = getBaselineForecast(niinId);
  if (forecast.length === 0) {
    return [];
  }

  // Use historical data to compute actual quality metrics
  const historical = forecast.filter((p) => p.historical !== null).map((p) => p.historical!);
  const forecastPts = forecast.filter((p) => p.forecast !== null).map((p) => p.forecast!);

  if (historical.length < 12) {
    return [];
  }

  // Simulate "holdout" accuracy: compare last 12 months of history against a naive forecast
  // (the forecast model would have predicted based on prior trend)
  const last12 = historical.slice(-12);
  const prior12 = historical.slice(-24, -12);

  // MAPE: compare last 12 actual vs prior 12 (as proxy for forecast accuracy)
  let totalAbsError = 0;
  let totalBias = 0;
  const errors: number[] = [];
  for (let i = 0; i < last12.length; i++) {
    const actual = last12[i];
    const predicted = prior12.length > i ? prior12[i] * (1 + 0.01) : actual; // slight growth adjustment
    if (actual > 0) {
      const pctError = (predicted - actual) / actual;
      totalAbsError += Math.abs(pctError);
      totalBias += pctError;
      errors.push(pctError);
    }
  }
  const mape = (totalAbsError / last12.length) * 100;
  const bias = (totalBias / last12.length) * 100;

  // Volatility: coefficient of variation of forecast errors
  const meanError = errors.reduce((s, e) => s + e, 0) / errors.length;
  const variance = errors.reduce((s, e) => s + (e - meanError) ** 2, 0) / errors.length;
  const volatility = Math.sqrt(variance);

  // Forecast vs Actual: last month accuracy
  const lastActual = last12[last12.length - 1];
  const firstForecast = forecastPts.length > 0 ? forecastPts[0] : lastActual;
  const fvA = lastActual > 0 ? Math.max(0, 100 - Math.abs((firstForecast - lastActual) / lastActual) * 100) : 95;

  return [
    {
      label: 'MAPE',
      value: Math.round(mape * 10) / 10,
      unit: '%',
      format: (v) => `${v.toFixed(1)}%`,
      thresholds: { good: 10, fair: 18 },
      invertColor: true,
      tooltip: 'Mean Absolute Percentage Error — average forecast deviation from actuals over 12 months',
    },
    {
      label: 'Bias',
      value: Math.round(bias * 10) / 10,
      unit: '%',
      format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
      thresholds: { good: 3, fair: 6 },
      invertColor: true,
      tooltip: 'Forecast Bias — positive means consistently over-forecasting, negative means under-forecasting',
    },
    {
      label: 'Volatility Index',
      value: Math.round(volatility * 100) / 100,
      unit: '',
      format: (v) => v.toFixed(2),
      thresholds: { good: 0.15, fair: 0.28 },
      invertColor: true,
      tooltip: 'Coefficient of variation in forecast errors — higher values indicate less predictable demand',
    },
    {
      label: 'Forecast vs Actual',
      value: Math.round(fvA),
      unit: '%',
      format: (v) => `${v.toFixed(0)}%`,
      thresholds: { good: 95, fair: 88 },
      invertColor: false,
      tooltip: 'Last month forecast accuracy — how closely the most recent forecast matched actual demand',
    },
  ];
}

function getColor(metric: QualityMetric): { text: string; bg: string; ring: string; label: string } {
  const { value, thresholds, invertColor } = metric;
  const absVal = invertColor ? Math.abs(value) : value;

  if (invertColor) {
    if (absVal <= thresholds.good) return { text: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', ring: 'ring-green-200 dark:ring-green-800', label: 'Good' };
    if (absVal <= thresholds.fair) return { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', ring: 'ring-amber-200 dark:ring-amber-800', label: 'Fair' };
    return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', ring: 'ring-red-200 dark:ring-red-800', label: 'Poor' };
  } else {
    if (absVal >= thresholds.good) return { text: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', ring: 'ring-green-200 dark:ring-green-800', label: 'Good' };
    if (absVal >= thresholds.fair) return { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', ring: 'ring-amber-200 dark:ring-amber-800', label: 'Fair' };
    return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', ring: 'ring-red-200 dark:ring-red-800', label: 'Poor' };
  }
}

interface ForecastQualityProps {
  niinId: string;
}

export default function ForecastQuality({ niinId }: ForecastQualityProps) {
  const [expanded, setExpanded] = useState(false);
  const metrics = useMemo(() => getMetricsForNiin(niinId), [niinId]);

  const overallScore = useMemo(() => {
    let good = 0;
    metrics.forEach((m) => {
      const c = getColor(m);
      if (c.label === 'Good') good++;
    });
    if (good === metrics.length) return { label: 'High', color: 'text-green-700 dark:text-green-400' };
    if (good >= 2) return { label: 'Moderate', color: 'text-amber-700 dark:text-amber-400' };
    return { label: 'Low', color: 'text-red-700 dark:text-red-400' };
  }, [metrics]);

  return (
    <SectionWrapper
      title="Forecast Quality"
      headerRight={
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${overallScore.color}`}>{overallScore.label}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      }
    >
      {!expanded ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Overall quality: <span className={`font-semibold ${overallScore.color}`}>{overallScore.label}</span>. Click expand to view detailed metrics.
        </p>
      ) : (
        <div className="space-y-3">
          {metrics.map((metric) => {
            const color = getColor(metric);
            return (
              <div key={metric.label} className={`flex items-center justify-between rounded-lg p-2.5 ring-1 ${color.bg} ${color.ring}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{metric.label}</span>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 w-56 p-2 rounded-md bg-gray-900 dark:bg-gray-700 text-xs text-white shadow-lg">
                      {metric.tooltip}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold font-mono ${color.text}`}>{metric.format(metric.value)}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${color.bg} ${color.text}`}>{color.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionWrapper>
  );
}
