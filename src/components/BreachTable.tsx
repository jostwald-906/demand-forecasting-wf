import { useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { useAppState } from '@/context/AppContext';
import type { BreachRow } from '@/types';

interface BreachTableProps {
  data: BreachRow[];
  unitCost: number;
  loading?: boolean;
}

function riskColor(prob: number): string {
  if (prob < 20) return 'text-green-700 dark:text-green-400';
  if (prob < 60) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
}

function daysColor(days: number): string {
  if (days < 30) return 'text-red-700 dark:text-red-400 font-bold';
  if (days < 90) return 'text-amber-700 dark:text-amber-400 font-medium';
  return 'text-gray-600 dark:text-gray-400';
}

export default function BreachTable({ data, unitCost, loading }: BreachTableProps) {
  const [showAll, setShowAll] = useState(false);
  const { displayMode } = useAppState();
  const isDollars = displayMode === 'dollars';

  const breachRows = data.filter((r) => r.gap < 0);
  const displayRows = showAll ? data : breachRows;
  const hasBreach = breachRows.length > 0;

  const formatVal = (v: number) => {
    if (isDollars) {
      const dv = Math.round(v * unitCost);
      return `$${dv.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return v.toLocaleString();
  };

  return (
    <SectionWrapper
      title="Supply Shortfall Analysis"
      loading={loading}
      empty={data.length === 0}
      emptyMessage="No supply data available"
      headerRight={
        <button
          onClick={() => setShowAll(!showAll)}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showAll ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showAll ? 'Breaches only' : 'Show all periods'}
        </button>
      }
    >
      {!hasBreach && !showAll ? (
        <div className="flex flex-col items-center py-6 text-green-600 dark:text-green-400">
          <p className="text-sm font-medium">No supply shortfalls detected</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All periods meet demand requirements</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Period</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Demand</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Supply</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Gap</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">P(Stockout)</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Days to Impact</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr
                  key={row.period}
                  className={clsx(
                    'border-b border-gray-100 dark:border-gray-700',
                    row.gap < 0 && 'bg-red-50 dark:bg-red-900/20'
                  )}
                >
                  <td className="py-1.5 px-2 font-medium text-gray-900 dark:text-gray-100">{row.period}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{formatVal(row.forecastDemand)}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{formatVal(row.availableSupply)}</td>
                  <td className={clsx('py-1.5 px-2 text-right', row.gap < 0 ? 'text-red-700 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400')}>
                    {formatVal(row.gap)}
                  </td>
                  <td className={clsx('py-1.5 px-2 text-right', riskColor(row.stockoutProbability))}>
                    {row.stockoutProbability}%
                  </td>
                  <td className={clsx('py-1.5 px-2 text-right', row.daysToImpact < 999 ? daysColor(row.daysToImpact) : 'text-gray-400 dark:text-gray-500')}>
                    {row.daysToImpact < 999 ? `${row.daysToImpact}d` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionWrapper>
  );
}
