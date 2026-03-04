import SectionWrapper from './SectionWrapper';
import Tile from './Tile';
import StatusPill from './StatusPill';
import type { RiskData } from '@/types';

interface RiskTilesProps {
  risk: RiskData;
  baselineRisk: RiskData;
  loading?: boolean;
}

function riskVariant(prob: number): 'risk-low' | 'risk-medium' | 'risk-high' {
  if (prob < 20) return 'risk-low';
  if (prob < 60) return 'risk-medium';
  return 'risk-high';
}

function delta(current: number, baseline: number): { direction: 'up' | 'down' | 'flat'; label: string } | undefined {
  const diff = current - baseline;
  if (Math.abs(diff) < 0.5) return undefined;
  return {
    direction: diff > 0 ? 'up' : 'down',
    label: `${diff > 0 ? '+' : ''}${Math.round(diff)}pp vs baseline`,
  };
}

export default function RiskTiles({ risk, baselineRisk, loading }: RiskTilesProps) {
  return (
    <SectionWrapper title="Risk Assessment" loading={loading}>
      <div className="grid grid-cols-2 gap-2">
        <Tile
          label="Stockout Prob (90d)"
          value={`${risk.stockoutProb90d}%`}
          variant={riskVariant(risk.stockoutProb90d)}
          trend={delta(risk.stockoutProb90d, baselineRisk.stockoutProb90d)}
        />
        <Tile
          label="Stockout Prob (24mo)"
          value={`${risk.stockoutProb24mo}%`}
          variant={riskVariant(risk.stockoutProb24mo)}
          trend={delta(risk.stockoutProb24mo, baselineRisk.stockoutProb24mo)}
        />
        <Tile
          label="First Stockout"
          value={risk.firstProjectedStockout ?? 'None projected'}
          variant={risk.firstProjectedStockout ? 'risk-high' : 'risk-low'}
        />
        <Tile
          label="Service Level"
          value={`${risk.serviceLevelActual}% vs ${risk.serviceLevelPolicy}%`}
          variant={risk.serviceLevelActual < risk.serviceLevelPolicy ? 'risk-high' : 'risk-low'}
          subtitle="actual vs policy"
        />
        <div className="col-span-2">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between bg-white dark:bg-gray-800">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confidence</span>
              <div className="mt-1">
                <StatusPill label={risk.confidenceScore} />
              </div>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 max-w-[140px]" title="Based on data recency, model accuracy, and demand volatility">
              Based on model accuracy and demand volatility
            </span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
