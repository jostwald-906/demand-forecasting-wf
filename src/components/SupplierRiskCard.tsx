import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Shield, TrendingDown, Globe } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import type { NiinRecord } from '@/types';

interface SupplierMetrics {
  compositeScore: number;        // 0-100
  onTimeDelivery: number;        // percentage
  capacityUtilization: number;   // percentage
  financialHealth: 'Strong' | 'Stable' | 'Watch' | 'At Risk';
  geopoliticalRisk: boolean;
  singleSource: boolean;
  otdHistory: number[];          // 12 months
  dmsmsRisk: 'None' | 'Low' | 'Moderate' | 'High';
}

function getSupplierMetrics(niin: NiinRecord): SupplierMetrics {
  const seed = parseInt(niin.id.replace('niin-', ''), 10) || 1;
  const s = (seed * 41 + 7) % 100;

  // OTD inversely related to lead time: longer lead = harder to deliver on time
  const leadNormalized = Math.min(1, niin.leadTimeDays / 420);
  const otd = Math.round(95 - leadNormalized * 20 + ((s % 10) - 5));

  // Capacity: higher cost items from specialized lines tend to be at higher utilization
  const costNormalized = Math.min(1, niin.unitCost / 250000);
  const capacity = Math.round(60 + costNormalized * 25 + (s % 10));

  // Financial: single-source suppliers with high-value items tend to be stronger (sole-source contracts)
  // But very long lead times can indicate constrained suppliers
  const financialOptions: SupplierMetrics['financialHealth'][] = ['Strong', 'Stable', 'Watch', 'At Risk'];
  const financialIdx = niin.singleSource && niin.leadTimeDays > 300 ? Math.min(3, 2 + (s % 2)) :
    niin.unitCost > 50000 ? s % 2 : 1 + (s % 2);
  const financial = financialOptions[financialIdx];

  // Geo risk: based on supplier name heuristic + seed
  const geo = s > 80;

  // DMSMS: single-source + long lead time + high criticality = higher DMSMS risk
  const dmsmsOptions: SupplierMetrics['dmsmsRisk'][] = ['None', 'Low', 'Moderate', 'High'];
  const dmsmsIdx = (niin.singleSource ? 1 : 0) + (niin.leadTimeDays > 200 ? 1 : 0) + (niin.criticalityFlag ? 1 : 0);
  const dmsms = dmsmsOptions[Math.min(3, dmsmsIdx)];

  // Composite score
  const financialScore = financial === 'Strong' ? 90 : financial === 'Stable' ? 75 : financial === 'Watch' ? 50 : 30;
  const composite = Math.round(
    otd * 0.35 + (100 - capacity) * 0.15 + financialScore * 0.3 + (geo ? 0 : 20) * 0.1 + (niin.singleSource ? 0 : 20) * 0.1
  );

  // 12-month OTD history: slight downward trend if lead times are long
  const otdHistory = Array.from({ length: 12 }, (_, i) => {
    const base = otd;
    const noise = ((seed * 17 + i * 31) % 7) - 3;
    const trend = niin.leadTimeDays > 200 && i > 6 ? -Math.round((i - 6) * 0.8) : 0;
    return Math.max(50, Math.min(100, base + noise + trend));
  });

  return {
    compositeScore: composite,
    onTimeDelivery: otd,
    capacityUtilization: capacity,
    financialHealth: financial,
    geopoliticalRisk: geo,
    singleSource: niin.singleSource,
    otdHistory,
    dmsmsRisk: dmsms,
  };
}

function getScoreColor(score: number): { text: string; bg: string } {
  if (score >= 80) return { text: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
  if (score >= 60) return { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
  return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
}

function OTDSparkline({ data }: { data: number[] }) {
  const max = 100;
  const min = Math.min(...data) - 5;
  const range = max - min;
  const h = 28;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  // Reference line at 90%
  const refY = h - ((90 - min) / range) * h;
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <line x1="0" y1={refY} x2={w} y2={refY} stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2 2" />
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={w - 1} y={refY - 2} textAnchor="end" fontSize="7" fill="#9ca3af">90%</text>
    </svg>
  );
}

interface SupplierRiskCardProps {
  niin: NiinRecord;
}

export default function SupplierRiskCard({ niin }: SupplierRiskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const metrics = useMemo(() => getSupplierMetrics(niin), [niin]);
  const scoreColor = getScoreColor(metrics.compositeScore);

  const financialColor = {
    Strong: 'text-green-700 dark:text-green-400',
    Stable: 'text-blue-700 dark:text-blue-400',
    Watch: 'text-amber-700 dark:text-amber-400',
    'At Risk': 'text-red-700 dark:text-red-400',
  }[metrics.financialHealth];

  return (
    <SectionWrapper
      title="Supplier Intelligence"
      headerRight={
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${scoreColor.text}`}>{metrics.compositeScore}</span>
          {metrics.singleSource && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 uppercase">
              Single Source
            </span>
          )}
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
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">{niin.supplier}</span>
            {' \u2014 '}OTD {metrics.onTimeDelivery}% | Capacity {metrics.capacityUtilization}% |{' '}
            <span className={financialColor}>{metrics.financialHealth}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Supplier name + composite score */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{niin.supplier}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Lead Time: {niin.leadTimeDays}d</span>
            </div>
            <div className={`text-lg font-bold px-3 py-1 rounded-lg ${scoreColor.bg} ${scoreColor.text}`}>
              {metrics.compositeScore}
              <span className="text-[9px] font-normal ml-0.5">/100</span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">On-Time Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${metrics.onTimeDelivery >= 90 ? 'text-green-700 dark:text-green-400' : metrics.onTimeDelivery >= 80 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                  {metrics.onTimeDelivery}%
                </span>
                <OTDSparkline data={metrics.otdHistory} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex items-center gap-1 mb-1">
                <Shield className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Capacity Util.</span>
              </div>
              <span className={`text-lg font-bold ${metrics.capacityUtilization >= 90 ? 'text-red-700 dark:text-red-400' : metrics.capacityUtilization >= 75 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                {metrics.capacityUtilization}%
              </span>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full ${metrics.capacityUtilization >= 90 ? 'bg-red-500' : metrics.capacityUtilization >= 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${metrics.capacityUtilization}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Financial Health</span>
              <div className={`text-sm font-bold mt-1 ${financialColor}`}>{metrics.financialHealth}</div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">DMSMS Risk</span>
              <div className={`text-sm font-bold mt-1 ${
                metrics.dmsmsRisk === 'High' ? 'text-red-700 dark:text-red-400'
                : metrics.dmsmsRisk === 'Moderate' ? 'text-amber-700 dark:text-amber-400'
                : 'text-green-700 dark:text-green-400'
              }`}>
                {metrics.dmsmsRisk}
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-2">
            {metrics.geopoliticalRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                <Globe className="w-3 h-3" />
                Geopolitical Risk
              </span>
            )}
            {metrics.singleSource && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-3 h-3" />
                Single Source — No Alternate Qualified
              </span>
            )}
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}
