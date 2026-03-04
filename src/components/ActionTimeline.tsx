import { useState, useMemo } from 'react';
import { ShoppingCart, Zap, ArrowLeftRight, RefreshCw, ChevronRight } from 'lucide-react';
import { useAppDispatch } from '@/context/AppContext';
import type { Recommendation, ActionType } from '@/types';

interface ActionTimelineProps {
  data: Recommendation[];
  leadTimeDays?: number;
}

const ACTION_COLORS: Record<ActionType, { bar: string; border: string; text: string }> = {
  Buy: { bar: 'bg-blue-500 dark:bg-blue-600', border: 'border-blue-600 dark:border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  Expedite: { bar: 'bg-amber-500 dark:bg-amber-600', border: 'border-amber-600 dark:border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  Rebalance: { bar: 'bg-green-500 dark:bg-green-600', border: 'border-green-600 dark:border-green-500', text: 'text-green-700 dark:text-green-300' },
  'Alternate Source': { bar: 'bg-purple-500 dark:bg-purple-600', border: 'border-purple-600 dark:border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
};

const ACTION_ICONS: Record<ActionType, typeof ShoppingCart> = {
  Buy: ShoppingCart,
  Expedite: Zap,
  Rebalance: ArrowLeftRight,
  'Alternate Source': RefreshCw,
};

// Action duration as fraction of NIIN lead time
const ACTION_LEAD_FRACTIONS: Record<ActionType, number> = {
  Rebalance: 0.1,       // ~10% of lead time (lateral transfer)
  Expedite: 0.4,        // ~40% of lead time (expedited procurement)
  Buy: 1.0,             // full lead time
  'Alternate Source': 1.2, // 120% of lead time (new source qualification)
};

const MIN_DURATIONS: Record<ActionType, number> = {
  Rebalance: 7,
  Expedite: 21,
  Buy: 60,
  'Alternate Source': 90,
};

export default function ActionTimeline({ data, leadTimeDays = 90 }: ActionTimelineProps) {
  const dispatch = useAppDispatch();
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  const { timeline, minDate, maxDate, totalDays, today } = useMemo(() => {
    const now = new Date();

    const items = data.map((rec) => {
      const requiredBy = new Date(rec.requiredBy);
      const duration = Math.max(
        MIN_DURATIONS[rec.actionType],
        Math.round(leadTimeDays * ACTION_LEAD_FRACTIONS[rec.actionType])
      );
      const startDate = new Date(requiredBy.getTime() - duration * 24 * 60 * 60 * 1000);
      return { rec, startDate, endDate: requiredBy, duration };
    }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    if (items.length === 0) return { timeline: [], minDate: now, maxDate: now, totalDays: 1, today: now };

    const allDates = items.flatMap((i) => [i.startDate, i.endDate]);
    allDates.push(now);
    const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
    // Add padding
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);
    const total = Math.max(1, (max.getTime() - min.getTime()) / (24 * 60 * 60 * 1000));

    return { timeline: items, minDate: min, maxDate: max, totalDays: total, today: now };
  }, [data]);

  // Determine dependencies: faster actions bridge until slower ones arrive
  const dependencies = useMemo(() => {
    const deps: { from: number; to: number }[] = [];
    const sorted = [...timeline].sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      // Bridge dependency: if earlier action ends before later starts or overlaps
      if (current.endDate.getTime() <= next.endDate.getTime() &&
          current.rec.actionType !== next.rec.actionType) {
        const fromIdx = timeline.indexOf(current);
        const toIdx = timeline.indexOf(next);
        deps.push({ from: fromIdx, to: toIdx });
      }
    }
    return deps;
  }, [timeline]);

  const getPosition = (date: Date) => {
    return ((date.getTime() - minDate.getTime()) / (totalDays * 24 * 60 * 60 * 1000)) * 100;
  };

  const todayPosition = getPosition(today);

  // Generate month markers
  const monthMarkers = useMemo(() => {
    const markers: { label: string; position: number }[] = [];
    const cursor = new Date(minDate);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= maxDate) {
      markers.push({
        label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        position: getPosition(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return markers;
  }, [minDate, maxDate, totalDays]);

  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
        No actions to display on timeline
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {Object.entries(ACTION_COLORS).map(([type, colors]) => {
            const Icon = ACTION_ICONS[type as ActionType];
            return (
              <span key={type} className="inline-flex items-center gap-1 text-[10px]">
                <Icon className={`w-3 h-3 ${colors.text}`} />
                <span className="text-gray-600 dark:text-gray-400">{type}</span>
              </span>
            );
          })}
        </div>
        <label className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showCriticalPath}
            onChange={() => setShowCriticalPath(!showCriticalPath)}
            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 w-3 h-3"
          />
          Show dependencies
        </label>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Month headers */}
        <div className="relative h-5 mb-1">
          {monthMarkers.map((m) => (
            <span
              key={m.label}
              className="absolute text-[9px] text-gray-400 dark:text-gray-500 font-medium"
              style={{ left: `${m.position}%`, transform: 'translateX(-50%)' }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Grid lines + today */}
        <div className="relative">
          {/* Grid lines */}
          {monthMarkers.map((m) => (
            <div
              key={`grid-${m.label}`}
              className="absolute top-0 bottom-0 border-l border-gray-100 dark:border-gray-700"
              style={{ left: `${m.position}%`, height: `${timeline.length * 44 + 8}px` }}
            />
          ))}

          {/* Today line */}
          <div
            className="absolute top-0 border-l-2 border-red-500 z-10"
            style={{ left: `${todayPosition}%`, height: `${timeline.length * 44 + 8}px` }}
          >
            <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-1">
              Today
            </span>
          </div>

          {/* Rows */}
          <div className="space-y-1 pt-1">
            {timeline.map((item, rowIdx) => {
              const colors = ACTION_COLORS[item.rec.actionType];
              const Icon = ACTION_ICONS[item.rec.actionType];
              const startPct = getPosition(item.startDate);
              const endPct = getPosition(item.endDate);
              const widthPct = Math.max(2, endPct - startPct);
              const isCritical = showCriticalPath && dependencies.some((d) => d.from === rowIdx || d.to === rowIdx);

              return (
                <div
                  key={item.rec.id}
                  className="relative h-10 flex items-center cursor-pointer group"
                  onClick={() => dispatch({ type: 'OPEN_FLYOUT', actionId: item.rec.id })}
                >
                  {/* Background */}
                  <div className="absolute inset-0 rounded bg-gray-50 dark:bg-gray-800/50" />

                  {/* Bar */}
                  <div
                    className={`absolute h-7 rounded flex items-center gap-1 px-2 ${colors.bar} ${isCritical ? 'ring-2 ring-red-400 dark:ring-red-500' : ''} shadow-sm hover:opacity-90 transition-opacity`}
                    style={{ left: `${startPct}%`, width: `${widthPct}%`, minWidth: '80px' }}
                    title={`${item.rec.actionType}: ${item.rec.quantity} units by ${item.rec.requiredBy}`}
                  >
                    <Icon className="w-3 h-3 text-white flex-shrink-0" />
                    <span className="text-[10px] text-white font-medium truncate">
                      {item.rec.actionType} ({item.rec.quantity})
                    </span>
                    <span className="text-[9px] text-white/70 ml-auto flex-shrink-0 hidden group-hover:inline">
                      ${(item.rec.costImpact / 1000).toFixed(0)}k
                    </span>
                  </div>

                  {/* Dependency arrows */}
                  {showCriticalPath && dependencies
                    .filter((d) => d.from === rowIdx)
                    .map((dep) => (
                      <div
                        key={`dep-${dep.from}-${dep.to}`}
                        className="absolute z-20"
                        style={{ left: `${endPct}%`, top: '50%' }}
                      >
                        <ChevronRight className="w-3 h-3 text-red-500 dark:text-red-400" />
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary annotation */}
      <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
        {timeline.length} actions spanning {Math.round(totalDays)} days.
        {dependencies.length > 0 && ` ${dependencies.length} sequential dependencies identified.`}
        {timeline.some((i) => i.rec.actionType === 'Rebalance' || i.rec.actionType === 'Expedite') &&
          timeline.some((i) => i.rec.actionType === 'Buy') &&
          ' Short-term actions bridge the gap until procurement arrives.'}
      </div>
    </div>
  );
}
