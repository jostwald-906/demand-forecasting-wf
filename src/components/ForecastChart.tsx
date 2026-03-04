import { useMemo, useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import SectionWrapper from './SectionWrapper';
import ChartControls from './ChartControls';
import ModelSelector from './ModelSelector';
import { useAppState } from '@/context/AppContext';
import { sliceForecastByHorizon, isScenarioModified, getChartEvents, getBaselineInventory, getOperationalData } from '@/data';
import { runMonteCarlo } from '@/data/monteCarloEngine';
import type { ForecastPoint, Granularity } from '@/types';
import type { ChartEvent } from '@/data';

interface ForecastChartProps {
  forecast: ForecastPoint[];
  unitCost: number;
  niinId?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

function aggregateByGranularity(data: ForecastPoint[], granularity: Granularity): ForecastPoint[] {
  if (granularity === 'monthly') return data;

  const bucketSize = granularity === 'quarterly' ? 3 : 12;
  const result: ForecastPoint[] = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const slice = data.slice(i, i + bucketSize);
    if (slice.length === 0) continue;

    const histVals = slice.filter((p) => p.historical !== null).map((p) => p.historical!);
    const fcVals = slice.filter((p) => p.forecast !== null).map((p) => p.forecast!);
    const scVals = slice.filter((p) => p.scenarioForecast !== null && p.scenarioForecast !== undefined).map((p) => p.scenarioForecast!);
    const loVals = slice.filter((p) => p.confidenceLow !== null).map((p) => p.confidenceLow!);
    const hiVals = slice.filter((p) => p.confidenceHigh !== null).map((p) => p.confidenceHigh!);

    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    result.push({
      date: slice[0].date,
      historical: avg(histVals),
      forecast: avg(fcVals),
      scenarioForecast: avg(scVals),
      confidenceLow: loVals.length > 0 ? Math.min(...loVals) : null,
      confidenceHigh: hiVals.length > 0 ? Math.max(...hiVals) : null,
    });
  }

  return result;
}

function applyDollarConversion(data: ForecastPoint[], unitCost: number): ForecastPoint[] {
  return data.map((pt) => ({
    ...pt,
    historical: pt.historical !== null ? Math.round(pt.historical * unitCost) : null,
    forecast: pt.forecast !== null ? Math.round(pt.forecast * unitCost) : null,
    scenarioForecast: pt.scenarioForecast !== null && pt.scenarioForecast !== undefined ? Math.round(pt.scenarioForecast * unitCost) : pt.scenarioForecast,
    confidenceLow: pt.confidenceLow !== null ? Math.round(pt.confidenceLow * unitCost) : null,
    confidenceHigh: pt.confidenceHigh !== null ? Math.round(pt.confidenceHigh * unitCost) : null,
  }));
}

function formatDate(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr);
  if (granularity === 'annual') return d.getFullYear().toString();
  if (granularity === 'quarterly') {
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

const EVENT_COLORS: Record<ChartEvent['type'], string> = {
  contract: '#8b5cf6',
  engineering: '#f59e0b',
  retirement: '#ef4444',
  deployment: '#22c55e',
};

export default function ForecastChart({ forecast, unitCost, niinId, loading, error, onRetry }: ForecastChartProps) {
  const { horizon, granularity, overlayEnabled, activeScenarioParams, displayMode, monteCarloEnabled } = useAppState();
  const showOverlay = overlayEnabled && isScenarioModified(activeScenarioParams);
  const isDollars = displayMode === 'dollars';
  const isDark = useDarkMode();

  // Monte Carlo simulation — uses actual inventory data
  const mcResult = useMemo(() => {
    if (!monteCarloEnabled || !niinId) return null;
    const seed = parseInt(niinId.replace('niin-', ''), 10) || 1;
    const inv = getBaselineInventory(niinId);
    const ops = getOperationalData(niinId);
    const safetyStock = inv.length > 0 ? inv[0].safetyStock : 10;
    const startingOnHand = ops?.onHand ?? safetyStock * 2;
    const qReceipts = inv.length > 0 ? inv[0].receipts : startingOnHand / 2;
    return runMonteCarlo(forecast, seed, safetyStock, startingOnHand, qReceipts, 50);
  }, [monteCarloEnabled, forecast, niinId]);

  const chartData = useMemo(() => {
    const sliced = sliceForecastByHorizon(forecast, horizon);
    const aggregated = aggregateByGranularity(sliced, granularity);
    let data = isDollars ? applyDollarConversion(aggregated, unitCost) : aggregated;

    // Merge Monte Carlo percentile bands
    if (mcResult && monteCarloEnabled) {
      const forecastStart = data.findIndex((p) => p.forecast !== null);
      if (forecastStart >= 0) {
        data = data.map((pt, i) => {
          const mcIdx = i - forecastStart;
          if (mcIdx < 0 || mcIdx >= mcResult.p10.length) return pt;
          const mult = isDollars ? unitCost : 1;
          return {
            ...pt,
            mcP10: Math.round(mcResult.p10[mcIdx] * mult),
            mcP50: Math.round(mcResult.p50[mcIdx] * mult),
            mcP90: Math.round(mcResult.p90[mcIdx] * mult),
            // Sample paths for rendering (thin lines)
            ...Object.fromEntries(
              mcResult.paths.slice(0, 20).map((path, pathIdx) => [
                `mcPath${pathIdx}`,
                mcIdx < path.length ? Math.round(path[mcIdx] * mult) : null,
              ])
            ),
          };
        });
      }
    }

    return data;
  }, [forecast, horizon, granularity, isDollars, unitCost, mcResult, monteCarloEnabled]);

  // Find the "today" boundary
  const todayIndex = useMemo(() => {
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].forecast !== null) return i;
    }
    return chartData.length;
  }, [chartData]);

  const todayDate = chartData[todayIndex]?.date;
  const yLabel = isDollars ? 'Dollars ($)' : 'Units';

  // Get annotation events for this NIIN
  const events = useMemo(() => {
    if (!niinId) return [];
    const allEvents = getChartEvents(niinId);
    const dates = chartData.map((p) => p.date);
    return allEvents
      .map((evt) => {
        // Find closest date in chart data
        const closest = dates.reduce((best, d) =>
          Math.abs(new Date(d).getTime() - new Date(evt.date).getTime()) <
          Math.abs(new Date(best).getTime() - new Date(evt.date).getTime()) ? d : best
        , dates[0]);
        return { ...evt, chartDate: closest };
      })
      .filter((evt) => {
        const idx = dates.indexOf(evt.chartDate);
        return idx >= 0;
      });
  }, [niinId, chartData]);

  // Dark-mode-aware chart colors
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const historicalColor = isDark ? '#9ca3af' : '#374151';
  const bgColor = isDark ? '#1f2937' : '#ffffff'; // matches dark:bg-gray-800
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  const formatValue = (value: number) => {
    if (isDollars) return `$${value?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    return value?.toLocaleString('en-US', { maximumFractionDigits: 1 });
  };

  return (
    <div data-section="forecast-chart">
      <ChartControls />
      <SectionWrapper
        title="Demand Forecast"
        loading={loading}
        error={error}
        onRetry={onRetry}
        className="rounded-t-none border-t-0"
        headerRight={niinId ? <ModelSelector niinId={niinId} /> : undefined}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: isDollars ? 20 : 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, granularity)}
                tick={{ fontSize: 10, fill: tickColor }}
                interval="preserveStartEnd"
                stroke={gridColor}
              />
              <YAxis
                tick={{ fontSize: 10, fill: tickColor }}
                tickFormatter={isDollars ? (v: number) => `$${(v / 1000).toFixed(0)}k` : undefined}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: tickColor } }}
                stroke={gridColor}
              />
              <Tooltip
                labelFormatter={(d) => formatDate(d as string, granularity)}
                formatter={(value: number, name: string) => [formatValue(value), name]}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: isDark ? '#e5e7eb' : '#111827',
                }}
                labelStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
              />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ color: tickColor }} />

              {/* Confidence band - uses background-aware eraser */}
              <Area
                dataKey="confidenceHigh"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={isDark ? 0.15 : 0.08}
                name="Confidence High"
                legendType="none"
              />
              <Area
                dataKey="confidenceLow"
                stroke="none"
                fill={bgColor}
                fillOpacity={1}
                name="Confidence Low"
                legendType="none"
              />

              {/* Today reference line */}
              {todayDate && (
                <ReferenceLine
                  x={todayDate}
                  stroke={tickColor}
                  strokeDasharray="4 4"
                  label={{ value: 'Today', position: 'top', fontSize: 10, fill: tickColor }}
                />
              )}

              {/* Historical demand */}
              <Line
                dataKey="historical"
                stroke={historicalColor}
                strokeWidth={2}
                dot={false}
                name="Historical"
                connectNulls={false}
              />

              {/* Baseline forecast */}
              <Line
                dataKey="forecast"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Forecast (Baseline)"
                connectNulls={false}
              />

              {/* Scenario overlay - thicker, more distinct */}
              {showOverlay && (
                <Line
                  dataKey="scenarioForecast"
                  stroke="#ef4444"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={false}
                  name="Scenario"
                  connectNulls={false}
                />
              )}

              {/* Monte Carlo simulation paths */}
              {monteCarloEnabled && mcResult && (
                <>
                  {/* P10-P90 band */}
                  <Area dataKey="mcP90" stroke="none" fill="#8b5cf6" fillOpacity={isDark ? 0.12 : 0.06} name="P90" legendType="none" />
                  <Area dataKey="mcP10" stroke="none" fill={bgColor} fillOpacity={1} name="P10" legendType="none" />
                  {/* Sample paths */}
                  {Array.from({ length: 20 }, (_, i) => (
                    <Line
                      key={`mc-${i}`}
                      dataKey={`mcPath${i}`}
                      stroke="#8b5cf6"
                      strokeWidth={0.5}
                      strokeOpacity={0.25}
                      dot={false}
                      connectNulls={false}
                      name={`Sim ${i + 1}`}
                      legendType="none"
                    />
                  ))}
                  {/* P50 median line */}
                  <Line dataKey="mcP50" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="P50 (Median)" connectNulls={false} />
                </>
              )}

              {/* Event annotation markers */}
              {events.map((evt, i) => (
                <ReferenceLine
                  key={`evt-${i}`}
                  x={evt.chartDate}
                  stroke={EVENT_COLORS[evt.type]}
                  strokeDasharray="2 3"
                  strokeWidth={1.5}
                  label={{
                    value: evt.label,
                    position: i % 2 === 0 ? 'insideTopRight' : 'insideBottomRight',
                    fontSize: 9,
                    fill: EVENT_COLORS[evt.type],
                    fontWeight: 600,
                  }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {monteCarloEnabled && mcResult && (
          <div className="mt-2 flex items-center gap-3 text-[10px]">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-medium">
              {mcResult.breachCount} of {mcResult.totalPaths} paths breach safety stock
              {mcResult.breachQuarter && ` by ${mcResult.breachQuarter}`}
            </span>
            <span className="text-gray-400 dark:text-gray-500">P10/P50/P90 bands shown</span>
          </div>
        )}
      </SectionWrapper>
    </div>
  );
}
