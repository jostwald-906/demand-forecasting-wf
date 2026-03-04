import { useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, ArrowLeftRight } from 'lucide-react';
import { useAppState, useAppDispatch, useSelectedNiinData } from '@/context/AppContext';
import { getRebalanceCandidates } from '@/data';

export default function ActionDetailFlyout() {
  const { flyoutActionId } = useAppState();
  const dispatch = useAppDispatch();
  const data = useSelectedNiinData();

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE_FLYOUT' });
  }, [dispatch]);

  // Escape key to close
  useEffect(() => {
    if (!flyoutActionId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [flyoutActionId, close]);

  // Lock body scroll when open
  useEffect(() => {
    if (flyoutActionId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [flyoutActionId]);

  if (!flyoutActionId || !data) return null;

  const rec = data.recommendations.find((r) => r.id === flyoutActionId);
  if (!rec) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 transition-opacity"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 translate-x-0 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{rec.actionType}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.niin.niin} - {data.niin.nomenclature}</p>
          </div>
          <button onClick={close} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryItem label="Quantity" value={rec.quantity.toLocaleString('en-US')} />
            <SummaryItem label="Required By" value={new Date(rec.requiredBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
            <SummaryItem label="Cost Impact" value={`$${rec.costImpact.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
            <SummaryItem label="Service Uplift" value={`+${rec.serviceUplift.toFixed(1)}%`} />
          </div>

          {/* Rationale */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Rationale
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{rec.rationale}</p>
          </div>

          {/* Impact if Executed */}
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
            <h4 className="text-xs font-semibold text-green-800 dark:text-green-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Impact if Executed
            </h4>
            <p className="text-sm text-green-900 dark:text-green-300 leading-relaxed">{rec.impactIfExecuted}</p>
          </div>

          {/* Impact if Not Executed */}
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <h4 className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Impact if Not Executed
            </h4>
            <p className="text-sm text-red-900 dark:text-red-300 leading-relaxed">{rec.impactIfNotExecuted}</p>
          </div>

          {/* Assumptions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assumptions</h4>
            <ul className="space-y-1">
              {rec.assumptions.map((a, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-500 mt-0.5">&bull;</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Breach Context */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Resolves breach in</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{rec.breachPeriod}</p>
          </div>

          {/* Rebalance Candidates (shown for Rebalance actions) */}
          {rec.actionType === 'Rebalance' && (
            <RebalanceCandidatesSection niinId={data.niin.id} />
          )}
        </div>
      </div>
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-2.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
    </div>
  );
}

function RebalanceCandidatesSection({ niinId }: { niinId: string }) {
  const candidates = getRebalanceCandidates(niinId);
  if (candidates.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
        <ArrowLeftRight className="w-3.5 h-3.5" /> Rebalance Candidates
      </h4>
      <div className="space-y-2">
        {candidates.map((c, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.sourceBase}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                c.condition === 'Serviceable'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : c.condition === 'In Repair'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {c.condition}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <span className="text-gray-400 dark:text-gray-500">Qty:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{c.availableQty}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Transfer:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{c.transferTimeDays}d</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Cost:</span>{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">${c.estimatedCost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
