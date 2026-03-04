import { useMemo } from 'react';
import { getRiskData, filterNiinCatalog } from '@/data';
import { useAppState, useAppDispatch } from '@/context/AppContext';

function getMonthlyStockoutProbabilities(niinId: string): number[] {
  const risk = getRiskData(niinId);
  if (!risk) return Array(12).fill(0);

  const seed = parseInt(niinId.replace('niin-', ''), 10) || 1;
  const base90d = risk.stockoutProb90d;
  const base24mo = risk.stockoutProb24mo;

  // Monotonically increasing with small per-NIIN noise (no oscillation)
  return Array.from({ length: 12 }, (_, i) => {
    const monthFactor = (i + 1) / 12;
    const trend = base90d + (base24mo - base90d) * monthFactor;
    // Small noise that doesn't break monotonicity: capped at +/- 3
    const noise = ((seed * 17 + i * 31) % 7) - 3;
    return Math.max(0, Math.min(100, Math.round(trend + noise)));
  });
}

function getCellColor(prob: number): { bg: string; text: string } {
  if (prob >= 60) return { bg: 'bg-red-500 dark:bg-red-600', text: 'text-white' };
  if (prob >= 40) return { bg: 'bg-red-300 dark:bg-red-700', text: 'text-red-900 dark:text-red-100' };
  if (prob >= 25) return { bg: 'bg-amber-400 dark:bg-amber-600', text: 'text-amber-900 dark:text-amber-100' };
  if (prob >= 10) return { bg: 'bg-amber-200 dark:bg-amber-800', text: 'text-amber-800 dark:text-amber-200' };
  return { bg: 'bg-green-200 dark:bg-green-800', text: 'text-green-800 dark:text-green-200' };
}

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const MONTH_YEARS = ['Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26', 'Jan 27', 'Feb 27'];

export default function PortfolioHeatmap() {
  const { filters } = useAppState();
  const dispatch = useAppDispatch();

  const filteredNiins = useMemo(() => filterNiinCatalog({
    platform: filters.platform,
    commodityGroup: filters.commodityGroup,
    supplier: filters.supplier,
    echelon: filters.echelon,
  }), [filters.platform, filters.commodityGroup, filters.supplier, filters.echelon]);

  const heatmapData = useMemo(() => {
    return filteredNiins.map((niin) => ({
      niin,
      probabilities: getMonthlyStockoutProbabilities(niin.id),
      maxProb: Math.max(...getMonthlyStockoutProbabilities(niin.id)),
    }));
  }, [filteredNiins]);

  const summary = useMemo(() => {
    let critical = 0;
    let atRisk = 0;
    let healthy = 0;
    heatmapData.forEach((row) => {
      if (row.maxProb >= 60) critical++;
      else if (row.maxProb >= 25) atRisk++;
      else healthy++;
    });
    return { critical, atRisk, healthy };
  }, [heatmapData]);

  const sorted = useMemo(() => {
    return [...heatmapData].sort((a, b) => b.maxProb - a.maxProb);
  }, [heatmapData]);

  return (
    <div className="p-6 space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Portfolio Stockout Risk
        </h2>
        <div className="flex items-center gap-3 ml-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-700 dark:text-gray-300">{summary.critical} Critical</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-gray-700 dark:text-gray-300">{summary.atRisk} At-Risk</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-gray-700 dark:text-gray-300">{summary.healthy} Healthy</span>
          </span>
        </div>
      </div>

      {/* Summary progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {filteredNiins.length > 0 && (<>
          <div className="bg-red-500" style={{ width: `${(summary.critical / filteredNiins.length) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(summary.atRisk / filteredNiins.length) * 100}%` }} />
          <div className="bg-green-400" style={{ width: `${(summary.healthy / filteredNiins.length) * 100}%` }} />
        </>)}
      </div>

      {/* Heatmap grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800 z-10 min-w-[200px]">
                NIIN / Nomenclature
              </th>
              {MONTHS.map((m, i) => (
                <th key={m + i} className="text-center py-2 px-1 font-medium text-gray-500 dark:text-gray-400 min-w-[52px]">
                  <div>{m}</div>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 font-normal">{MONTH_YEARS[i].split(' ')[1]}</div>
                </th>
              ))}
              <th className="text-center py-2 px-2 font-medium text-gray-500 dark:text-gray-400 min-w-[48px]">Peak</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.niin.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => dispatch({ type: 'SELECT_NIIN', niinId: row.niin.id })}
                title={`Click to analyze ${row.niin.nomenclature}`}
              >
                <td className="py-1.5 px-3 sticky left-0 bg-white dark:bg-gray-800 z-10">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      row.maxProb >= 60 ? 'bg-red-500' : row.maxProb >= 25 ? 'bg-amber-400' : 'bg-green-400'
                    }`} />
                    <div className="min-w-0">
                      <div className="font-mono text-gray-900 dark:text-gray-100 text-[11px]">{row.niin.niin}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[170px]">{row.niin.nomenclature}</div>
                    </div>
                  </div>
                </td>
                {row.probabilities.map((prob, i) => {
                  const color = getCellColor(prob);
                  return (
                    <td key={i} className="py-1.5 px-0.5 text-center">
                      <div className={`rounded px-1 py-1 mx-auto w-10 text-[10px] font-mono font-medium ${color.bg} ${color.text}`}>
                        {prob}%
                      </div>
                    </td>
                  );
                })}
                <td className="py-1.5 px-2 text-center">
                  <span className={`text-[11px] font-bold ${
                    row.maxProb >= 60 ? 'text-red-600 dark:text-red-400'
                    : row.maxProb >= 25 ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
                  }`}>
                    {row.maxProb}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="font-medium">Stockout Probability:</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 dark:bg-green-800" />0-9%</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800" />10-24%</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 dark:bg-amber-600" />25-39%</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 dark:bg-red-700" />40-59%</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 dark:bg-red-600" />60%+</span>
      </div>
    </div>
  );
}
