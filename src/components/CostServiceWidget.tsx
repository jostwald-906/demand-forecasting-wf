import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import SectionWrapper from './SectionWrapper';
import type { Recommendation } from '@/types';

interface CostServiceWidgetProps {
  data: Recommendation[];
}

export default function CostServiceWidget({ data }: CostServiceWidgetProps) {
  const totalCost = useMemo(() => data.reduce((s, r) => s + r.costImpact, 0), [data]);
  const [budgetCap, setBudgetCap] = useState(totalCost);

  // Sort by cost-effectiveness (service uplift per dollar)
  const ranked = useMemo(() => {
    return [...data]
      .map((r) => ({
        id: r.id,
        actionType: r.actionType,
        cost: r.costImpact,
        serviceUplift: r.serviceUplift,
        efficiency: r.costImpact > 0 ? r.serviceUplift / r.costImpact : 0,
      }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [data]);

  // Compute cumulative curve points
  const curvePoints = useMemo(() => {
    const points: { cumulativeCost: number; cumulativeService: number; label: string }[] = [
      { cumulativeCost: 0, cumulativeService: 0, label: 'No actions' },
    ];
    let runningCost = 0;
    let runningService = 0;
    for (const r of ranked) {
      runningCost += r.cost;
      runningService += r.serviceUplift;
      points.push({
        cumulativeCost: runningCost,
        cumulativeService: Math.round(runningService * 10) / 10,
        label: r.actionType,
      });
    }
    return points;
  }, [ranked]);

  // Which actions fit in budget
  const includedActions = useMemo(() => {
    const included: typeof ranked = [];
    let running = 0;
    for (const r of ranked) {
      if (running + r.cost <= budgetCap) {
        included.push(r);
        running += r.cost;
      }
    }
    return included;
  }, [ranked, budgetCap]);

  const includedService = includedActions.reduce((s, r) => s + r.serviceUplift, 0);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';

  const formatCost = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  if (data.length === 0) return null;

  return (
    <SectionWrapper
      title="Cost vs Service Tradeoff"
      headerRight={
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Budget: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCost(budgetCap)}</span>
          </span>
          <span className="text-green-700 dark:text-green-400 font-medium">
            +{includedService.toFixed(1)}% service
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {includedActions.length}/{data.length} actions
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Budget slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">$0</span>
          <input
            type="range"
            min={0}
            max={totalCost}
            step={Math.max(1, Math.round(totalCost / 100))}
            value={budgetCap}
            onChange={(e) => setBudgetCap(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-primary-600"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 w-20 text-right shrink-0">{formatCost(totalCost)}</span>
        </div>

        {/* Efficient frontier chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                type="number"
                dataKey="cumulativeCost"
                name="Cumulative Cost"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: tickColor }}
                stroke={gridColor}
              />
              <YAxis
                type="number"
                dataKey="cumulativeService"
                name="Service Uplift"
                tickFormatter={(v) => `+${v}%`}
                tick={{ fontSize: 10, fill: tickColor }}
                stroke={gridColor}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'Cumulative Cost' ? formatCost(value) : `+${value.toFixed(1)}%`
                }
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
              />
              <ReferenceLine x={budgetCap} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Budget', fontSize: 10, fill: '#f59e0b' }} />
              <Scatter
                data={curvePoints}
                fill="#3b82f6"
                line={{ stroke: '#3b82f6', strokeWidth: 2 }}
                lineType="joint"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Included actions summary */}
        <div className="grid grid-cols-2 gap-2">
          {ranked.map((r) => {
            const included = includedActions.some((a) => a.id === r.id);
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border ${
                  included
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 line-through'
                }`}
              >
                <span className="font-medium">{r.actionType}</span>
                <span className="font-mono">{formatCost(r.cost)} / +{r.serviceUplift.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Actions ordered by cost-effectiveness (service uplift per dollar). Adjust the budget slider to see which actions fit within your budget constraint.
        </p>
      </div>
    </SectionWrapper>
  );
}
