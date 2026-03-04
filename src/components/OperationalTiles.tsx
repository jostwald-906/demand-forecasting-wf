import SectionWrapper from './SectionWrapper';
import Tile from './Tile';
import type { OperationalData, DisplayMode } from '@/types';

interface OperationalTilesProps {
  data: OperationalData;
  unitCost: number;
  displayMode: DisplayMode;
  loading?: boolean;
}

function formatValue(value: number, mode: DisplayMode, unitCost: number): string {
  if (mode === 'dollars') {
    const dollarValue = value * unitCost;
    if (dollarValue >= 1_000_000) return `$${(dollarValue / 1_000_000).toFixed(1)}M`;
    if (dollarValue >= 1_000) return `$${(dollarValue / 1_000).toFixed(0)}K`;
    return `$${dollarValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return value.toLocaleString('en-US');
}

export default function OperationalTiles({ data, unitCost, displayMode, loading }: OperationalTilesProps) {
  const unit = displayMode === 'dollars' ? undefined : 'units';

  return (
    <SectionWrapper title="Operational Snapshot" loading={loading}>
      <div className="grid grid-cols-3 gap-2">
        <Tile
          label="On-Hand"
          value={formatValue(data.onHand, displayMode, unitCost)}
          subtitle={unit}
        />
        <Tile
          label="On-Order"
          value={formatValue(data.onOrder, displayMode, unitCost)}
          subtitle={unit}
        />
        <Tile
          label="Backorders"
          value={formatValue(data.backorders, displayMode, unitCost)}
          subtitle={unit}
          variant={data.backorders > 0 ? 'warning' : 'default'}
        />
        <Tile
          label="Demand (90d)"
          value={formatValue(data.demand90d, displayMode, unitCost)}
          subtitle={unit}
        />
        <Tile
          label="Demand (12mo)"
          value={formatValue(data.demand12mo, displayMode, unitCost)}
          subtitle={unit}
        />
      </div>
    </SectionWrapper>
  );
}
