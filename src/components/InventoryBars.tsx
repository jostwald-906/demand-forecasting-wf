import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import SectionWrapper from './SectionWrapper';
import { useAppState } from '@/context/AppContext';
import type { InventoryBucket } from '@/types';

interface InventoryBarsProps {
  data: InventoryBucket[];
  unitCost: number;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function InventoryBars({ data, unitCost, loading, error, onRetry }: InventoryBarsProps) {
  const { displayMode } = useAppState();
  const isDollars = displayMode === 'dollars';
  const safetyStock = data[0]?.safetyStock ?? 0;
  const displaySafety = isDollars ? safetyStock * unitCost : safetyStock;

  const chartData = isDollars
    ? data.map((b) => ({
        ...b,
        receipts: Math.round(b.receipts * unitCost),
        endingInventory: Math.round(b.endingInventory * unitCost),
        startingInventory: Math.round(b.startingInventory * unitCost),
        consumption: Math.round(b.consumption * unitCost),
        safetyStock: Math.round(b.safetyStock * unitCost),
      }))
    : data;

  const formatVal = (v: number) =>
    isDollars ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : v.toLocaleString();

  return (
    <SectionWrapper title="Inventory Position" loading={loading} empty={data.length === 0} emptyMessage="No inventory data available" error={error} onRetry={onRetry}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: isDollars ? 20 : 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={isDollars ? (v: number) => `$${(v / 1000).toFixed(0)}k` : undefined}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload?.length) return null;
                const d = payload[0]?.payload as InventoryBucket;
                return (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
                    <p className="dark:text-gray-300">Starting: <span className="font-medium">{formatVal(d.startingInventory)}</span></p>
                    <p className="text-green-700 dark:text-green-400">+ Receipts: <span className="font-medium">{formatVal(d.receipts)}</span></p>
                    <p className="text-red-700 dark:text-red-400">- Consumption: <span className="font-medium">{formatVal(d.consumption)}</span></p>
                    <p className="border-t border-gray-100 dark:border-gray-600 pt-1 mt-1 dark:text-gray-300">Ending: <span className="font-medium">{formatVal(d.endingInventory)}</span></p>
                    <p className="dark:text-gray-300">Safety Stock: <span className="font-medium">{formatVal(d.safetyStock)}</span></p>
                    {d.isBreach && <p className="text-red-600 dark:text-red-400 font-medium mt-1">Below safety stock</p>}
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" height={28} />

            <ReferenceLine
              y={displaySafety}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: 'Safety Stock', position: 'right', fontSize: 10, fill: '#f59e0b' }}
            />

            <Bar dataKey="receipts" name="Receipts" stackId="a" barSize={20}>
              {chartData.map((entry) => (
                <Cell key={entry.period} fill={entry.isBreach ? '#fca5a5' : '#86efac'} />
              ))}
            </Bar>
            <Bar dataKey="endingInventory" name="Ending Inv." fill="#93c5fd" barSize={20}>
              {chartData.map((entry) => (
                <Cell key={entry.period} fill={entry.isBreach ? '#ef4444' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionWrapper>
  );
}
