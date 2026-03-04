import { useMemo } from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { filterNiinCatalog, getOperationalData, getRiskData, getAggregatedForecast } from '@/data';
import SectionWrapper from './SectionWrapper';
import Tile from './Tile';
import ForecastChart from './ForecastChart';
import type { NiinRecord, OperationalData } from '@/types';

export default function AggregatedView() {
  const { filters } = useAppState();
  const dispatch = useAppDispatch();

  const filteredNiins = useMemo(() => filterNiinCatalog({
    platform: filters.platform,
    commodityGroup: filters.commodityGroup,
    supplier: filters.supplier,
    echelon: filters.echelon,
    demandProgram: filters.demandProgram,
  }), [filters.platform, filters.commodityGroup, filters.supplier, filters.echelon, filters.demandProgram]);

  const aggregatedOps = useMemo(() => {
    const totals: OperationalData = { onHand: 0, onOrder: 0, backorders: 0, demand90d: 0, demand12mo: 0 };
    for (const niin of filteredNiins) {
      const ops = getOperationalData(niin.id);
      if (ops) {
        totals.onHand += ops.onHand;
        totals.onOrder += ops.onOrder;
        totals.backorders += ops.backorders;
        totals.demand90d += ops.demand90d;
        totals.demand12mo += ops.demand12mo;
      }
    }
    return totals;
  }, [filteredNiins]);

  const riskSummary = useMemo(() => {
    let critical = 0, atRisk = 0, healthy = 0;
    for (const niin of filteredNiins) {
      const risk = getRiskData(niin.id);
      if (!risk) continue;
      if (risk.stockoutProb90d >= 50) critical++;
      else if (risk.stockoutProb90d >= 15) atRisk++;
      else healthy++;
    }
    return { critical, atRisk, healthy };
  }, [filteredNiins]);

  const aggregatedForecast = useMemo(
    () => getAggregatedForecast(filteredNiins.map((n) => n.id)),
    [filteredNiins],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.demandProgram) labels.push(filters.demandProgram);
    if (filters.platform) labels.push(filters.platform);
    if (filters.commodityGroup) labels.push(filters.commodityGroup);
    if (filters.supplier) labels.push(filters.supplier);
    if (filters.echelon) labels.push(filters.echelon);
    return labels;
  }, [filters]);

  // Per-NIIN table rows with demand data
  const niinRows = useMemo(() => {
    return filteredNiins.map((niin) => {
      const ops = getOperationalData(niin.id);
      const risk = getRiskData(niin.id);
      return { niin, ops, risk };
    });
  }, [filteredNiins]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40">
            <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Aggregated Demand View
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredNiins.length} NIIN{filteredNiins.length !== 1 ? 's' : ''}
              </span>
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary tiles + Risk bar */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <SectionWrapper title="Portfolio Snapshot">
            <div className="grid grid-cols-5 gap-2">
              <Tile label="On-Hand" value={aggregatedOps.onHand.toLocaleString()} subtitle="units" />
              <Tile label="On-Order" value={aggregatedOps.onOrder.toLocaleString()} subtitle="units" />
              <Tile
                label="Backorders"
                value={aggregatedOps.backorders.toLocaleString()}
                subtitle="units"
                variant={aggregatedOps.backorders > 0 ? 'warning' : 'default'}
              />
              <Tile label="Demand (90d)" value={aggregatedOps.demand90d.toLocaleString()} subtitle="units" />
              <Tile label="Demand (12mo)" value={aggregatedOps.demand12mo.toLocaleString()} subtitle="units" />
            </div>
          </SectionWrapper>
        </div>
        <div className="col-span-5">
          <SectionWrapper title="Risk Distribution">
            <div className="grid grid-cols-3 gap-2">
              <Tile label="Critical" value={riskSummary.critical} variant="risk-high" subtitle={`>${'\u00A0'}50% stockout`} />
              <Tile label="At-Risk" value={riskSummary.atRisk} variant="risk-medium" subtitle="15-50% stockout" />
              <Tile label="Healthy" value={riskSummary.healthy} variant="risk-low" subtitle={`<${'\u00A0'}15% stockout`} />
            </div>
          </SectionWrapper>
        </div>
      </div>

      {/* Aggregated Forecast Chart */}
      <ForecastChart
        forecast={aggregatedForecast}
        unitCost={1}
      />

      {/* NIIN Breakdown Table */}
      <SectionWrapper title="Included NIINs" headerRight={
        <span className="text-xs text-gray-500 dark:text-gray-400">{filteredNiins.length} items</span>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-3">NIIN</th>
                <th className="pb-2 pr-3">Nomenclature</th>
                <th className="pb-2 pr-3">Program</th>
                <th className="pb-2 pr-3">Platform(s)</th>
                <th className="pb-2 pr-3 text-right">Demand (12mo)</th>
                <th className="pb-2 pr-3 text-right">Stockout Risk</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {niinRows.map(({ niin, ops, risk }) => (
                <NiinRow
                  key={niin.id}
                  niin={niin}
                  demand12mo={ops?.demand12mo ?? 0}
                  stockoutProb={risk?.stockoutProb90d ?? 0}
                  onSelect={() => dispatch({ type: 'SELECT_NIIN', niinId: niin.id })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SectionWrapper>
    </div>
  );
}

function NiinRow({
  niin,
  demand12mo,
  stockoutProb,
  onSelect,
}: {
  niin: NiinRecord;
  demand12mo: number;
  stockoutProb: number;
  onSelect: () => void;
}) {
  const riskColor =
    stockoutProb >= 50
      ? 'text-red-600 dark:text-red-400'
      : stockoutProb >= 15
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

  return (
    <tr
      onClick={onSelect}
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <td className="py-2 pr-3 font-mono text-xs text-gray-600 dark:text-gray-300">{niin.niin}</td>
      <td className="py-2 pr-3 text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{niin.nomenclature}</td>
      <td className="py-2 pr-3">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          niin.demandProgram === 'FHP'
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
        }`}>
          {niin.demandProgram}
        </span>
      </td>
      <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400">{niin.platforms.join(', ')}</td>
      <td className="py-2 pr-3 text-right font-medium text-gray-900 dark:text-gray-100">{demand12mo.toLocaleString()}</td>
      <td className={`py-2 pr-3 text-right font-medium ${riskColor}`}>{stockoutProb}%</td>
      <td className="py-2">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </td>
    </tr>
  );
}
