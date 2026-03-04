import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Search, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { getBaselineForecast, getRiskData, getOperationalData } from '@/data';

interface Anomaly {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  type: 'spike' | 'pattern_break' | 'correlation_shift' | 'trend_change' | 'seasonal_deviation';
  title: string;
  description: string;
  detectedAt: string;
  sparkline: number[];
  periodStart: string;
  periodEnd: string;
}

const ANOMALY_ICONS: Record<Anomaly['type'], typeof AlertTriangle> = {
  spike: Zap,
  pattern_break: Activity,
  correlation_shift: TrendingDown,
  trend_change: TrendingUp,
  seasonal_deviation: AlertTriangle,
};

const SEVERITY_STYLES: Record<Anomaly['severity'], { badge: string; border: string; icon: string }> = {
  critical: {
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    border: 'border-l-red-500',
    icon: 'text-red-500 dark:text-red-400',
  },
  high: {
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    border: 'border-l-amber-500',
    icon: 'text-amber-500 dark:text-amber-400',
  },
  medium: {
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    border: 'border-l-blue-500',
    icon: 'text-blue-500 dark:text-blue-400',
  },
};

function generateAnomalies(niinId: string): Anomaly[] {
  const forecast = getBaselineForecast(niinId);
  const risk = getRiskData(niinId);
  const ops = getOperationalData(niinId);
  if (!forecast.length || !risk || !ops) return [];

  const historical = forecast.filter((p) => p.historical !== null).map((p) => p.historical!);
  if (historical.length < 24) return [];

  const anomalies: Anomaly[] = [];
  const now = new Date();
  const last12 = historical.slice(-12);
  const prior12 = historical.slice(-24, -12);
  const last6 = historical.slice(-6);
  const prior6 = historical.slice(-12, -6);

  const avg12 = last12.reduce((s, v) => s + v, 0) / 12;
  const avgPrior = prior12.reduce((s, v) => s + v, 0) / 12;
  const avgLast6 = last6.reduce((s, v) => s + v, 0) / 6;
  const avgPrior6 = prior6.reduce((s, v) => s + v, 0) / 6;

  // 1. Spike Detection: if any of the last 3 months is >30% above 12-month average
  const last3 = historical.slice(-3);
  const maxRecent = Math.max(...last3);
  const spikePercent = avg12 > 0 ? ((maxRecent - avg12) / avg12) * 100 : 0;
  if (spikePercent > 25) {
    const severity = spikePercent > 50 ? 'critical' : spikePercent > 35 ? 'high' : 'medium';
    anomalies.push({
      id: `anom-${niinId}-spike`,
      severity,
      type: 'spike',
      title: 'Demand Spike Detected',
      description: `Recent demand is ${Math.round(spikePercent)}% above 12-month moving average (${avg12.toFixed(1)} units/mo). Peak month: ${maxRecent.toFixed(1)} units.`,
      detectedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sparkline: last12,
      periodStart: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0],
      periodEnd: now.toISOString().split('T')[0],
    });
  }

  // 2. Trend Change: if 6-month growth rate is accelerating
  const growthRate = avgPrior6 > 0 ? ((avgLast6 - avgPrior6) / avgPrior6) * 100 : 0;
  if (Math.abs(growthRate) > 10) {
    const direction = growthRate > 0 ? 'accelerating' : 'decelerating';
    const severity = risk.stockoutProb90d > 50 && growthRate > 0 ? 'critical' : Math.abs(growthRate) > 20 ? 'high' : 'medium';
    anomalies.push({
      id: `anom-${niinId}-trend`,
      severity,
      type: 'trend_change',
      title: `${growthRate > 0 ? 'Accelerating' : 'Decelerating'} Demand Trend`,
      description: `6-month demand ${direction}: ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}% vs prior period. Average went from ${avgPrior6.toFixed(1)} to ${avgLast6.toFixed(1)} units/mo.`,
      detectedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sparkline: last12,
      periodStart: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0],
      periodEnd: now.toISOString().split('T')[0],
    });
  }

  // 3. Service Level Gap: if actual service level is below policy
  const serviceGap = risk.serviceLevelPolicy - risk.serviceLevelActual;
  if (serviceGap > 3) {
    const severity = serviceGap > 15 ? 'critical' : serviceGap > 8 ? 'high' : 'medium';
    anomalies.push({
      id: `anom-${niinId}-service`,
      severity,
      type: 'pattern_break',
      title: 'Service Level Below Policy',
      description: `Actual service level (${risk.serviceLevelActual}%) is ${serviceGap}pp below target (${risk.serviceLevelPolicy}%). ${ops.backorders} active backorders contributing to gap.`,
      detectedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sparkline: last12,
      periodStart: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0],
      periodEnd: now.toISOString().split('T')[0],
    });
  }

  // 4. Inventory Burn Rate: if on-hand is depleting faster than resupply
  const dailyDemand = ops.demand90d / 90;
  const daysOfSupply = dailyDemand > 0 ? ops.onHand / dailyDemand : 999;
  if (daysOfSupply < 60 && ops.onOrder < ops.demand90d * 0.5) {
    const severity = daysOfSupply < 30 ? 'critical' : 'high';
    anomalies.push({
      id: `anom-${niinId}-burn`,
      severity,
      type: 'seasonal_deviation',
      title: 'Inventory Burn Rate Alert',
      description: `Only ${Math.round(daysOfSupply)} days of supply remaining at current demand rate (${dailyDemand.toFixed(1)}/day). On-order (${ops.onOrder}) covers only ${Math.round((ops.onOrder / ops.demand90d) * 100)}% of 90-day demand.`,
      detectedAt: now.toISOString(),
      sparkline: last12,
      periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
      periodEnd: now.toISOString().split('T')[0],
    });
  }

  // 5. Year-over-year change
  const yoyChange = avgPrior > 0 ? ((avg12 - avgPrior) / avgPrior) * 100 : 0;
  if (Math.abs(yoyChange) > 15 && !anomalies.some((a) => a.type === 'trend_change')) {
    anomalies.push({
      id: `anom-${niinId}-yoy`,
      severity: 'medium',
      type: 'correlation_shift',
      title: `Year-over-Year Demand ${yoyChange > 0 ? 'Increase' : 'Decrease'}`,
      description: `12-month average demand ${yoyChange > 0 ? 'increased' : 'decreased'} ${Math.abs(yoyChange).toFixed(0)}% compared to prior year (${avgPrior.toFixed(1)} → ${avg12.toFixed(1)} units/mo).`,
      detectedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      sparkline: [...prior12.slice(-6), ...last12.slice(-6)],
      periodStart: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0],
      periodEnd: now.toISOString().split('T')[0],
    });
  }

  return anomalies.sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  }).slice(0, 5);
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 20;
  const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

interface AnomalyFeedProps {
  niinId: string;
  onInvestigate?: () => void;
}

export default function AnomalyFeed({ niinId, onInvestigate }: AnomalyFeedProps) {
  const [expanded, setExpanded] = useState(true);
  const anomalies = useMemo(() => generateAnomalies(niinId), [niinId]);

  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;
  const highCount = anomalies.filter((a) => a.severity === 'high').length;

  if (anomalies.length === 0) {
    return (
      <SectionWrapper title="Demand Signal Anomalies">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No anomalies detected. Demand patterns are within expected ranges.
        </p>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title="Demand Signal Anomalies"
      headerRight={
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
              {criticalCount} critical
            </span>
          )}
          {highCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
              {highCount} high
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Collapse' : `${anomalies.length} signals`}
          </button>
        </div>
      }
    >
      {!expanded ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {anomalies.length} anomalies detected. {criticalCount > 0 ? `${criticalCount} require immediate attention.` : 'No critical signals.'} Click expand to review.
        </p>
      ) : (
        <div className="space-y-2">
          {anomalies.map((anomaly) => {
            const styles = SEVERITY_STYLES[anomaly.severity];
            const Icon = ANOMALY_ICONS[anomaly.type];
            const sparkColor = anomaly.severity === 'critical' ? '#ef4444' : anomaly.severity === 'high' ? '#f59e0b' : '#3b82f6';
            const daysAgo = Math.round((Date.now() - new Date(anomaly.detectedAt).getTime()) / (24 * 60 * 60 * 1000));

            return (
              <div
                key={anomaly.id}
                className={`rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${styles.border} p-3`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.icon}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{anomaly.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${styles.badge}`}>
                        {anomaly.severity}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0">
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                      {anomaly.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <MiniSparkline data={anomaly.sparkline} color={sparkColor} />
                      <button
                        onClick={() => {
                          if (onInvestigate) onInvestigate();
                          // Scroll to the forecast chart section
                          const chartEl = document.querySelector('[data-section="forecast-chart"]');
                          if (chartEl) chartEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Search className="w-2.5 h-2.5" />
                        Investigate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionWrapper>
  );
}
