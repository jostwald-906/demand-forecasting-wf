import { useState, useMemo, useCallback } from 'react';
import { ShoppingCart, Zap, ArrowLeftRight, RefreshCw, ChevronUp, ChevronDown, CheckCircle2, Download, List, GanttChart } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import StatusPill from './StatusPill';
import ActionTimeline from './ActionTimeline';
import { useAppDispatch } from '@/context/AppContext';
import { getNiinById } from '@/data';
import type { Recommendation, ActionType } from '@/types';

interface RecommendedActionsProps {
  data: Recommendation[];
  niinId?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const ACTION_ICONS: Record<ActionType, typeof ShoppingCart> = {
  Buy: ShoppingCart,
  Expedite: Zap,
  Rebalance: ArrowLeftRight,
  'Alternate Source': RefreshCw,
};

type SortKey = 'actionType' | 'quantity' | 'requiredBy' | 'costImpact' | 'serviceUplift' | 'confidence' | 'status';
type SortDir = 'asc' | 'desc';

export default function RecommendedActions({ data, niinId, loading, error, onRetry }: RecommendedActionsProps) {
  const dispatch = useAppDispatch();
  const [sortKey, setSortKey] = useState<SortKey>('costImpact');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleApprove = useCallback((e: React.MouseEvent, recId: string) => {
    e.stopPropagation();
    setApprovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const rows = sorted.map((rec) => ({
      Action: rec.actionType,
      Quantity: rec.quantity,
      'Required By': rec.requiredBy,
      'Cost Impact': rec.costImpact,
      'Service Uplift': `${rec.serviceUplift}%`,
      Confidence: rec.confidence,
      Owner: rec.owner,
      Status: approvedIds.has(rec.id) ? 'Approved' : rec.status,
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${row[h as keyof typeof row]}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'action-plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, approvedIds]);

  const formatCost = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formatQty = (v: number) => v.toLocaleString('en-US');

  const approvedCount = approvedIds.size;

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </th>
  );

  return (
    <SectionWrapper
      title="Recommended Actions"
      loading={loading}
      empty={data.length === 0}
      emptyMessage="No recommended actions for this NIIN"
      error={error}
      onRetry={onRetry}
      headerRight={
        data.length > 0 ? (
          <div className="flex items-center gap-2">
            {approvedCount > 0 && (
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                {approvedCount} approved
              </span>
            )}
            <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 border-l border-gray-300 dark:border-gray-600 transition-colors ${viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                title="Timeline view"
              >
                <GanttChart className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        ) : undefined
      }
    >
      {viewMode === 'timeline' ? (
        <ActionTimeline data={data} leadTimeDays={niinId ? getNiinById(niinId)?.leadTimeDays : undefined} />
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <SortHeader label="Action" field="actionType" />
              <SortHeader label="Qty" field="quantity" />
              <SortHeader label="Required By" field="requiredBy" />
              <SortHeader label="Cost Impact" field="costImpact" />
              <SortHeader label="Service Uplift" field="serviceUplift" />
              <SortHeader label="Confidence" field="confidence" />
              <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Owner</th>
              <SortHeader label="Status" field="status" />
              <th className="text-center py-2 px-2 font-medium text-gray-500 dark:text-gray-400 w-20">Approve</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rec) => {
              const Icon = ACTION_ICONS[rec.actionType];
              const isApproved = approvedIds.has(rec.id);
              return (
                <tr
                  key={rec.id}
                  onClick={() => dispatch({ type: 'OPEN_FLYOUT', actionId: rec.id })}
                  className="border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{rec.actionType}</span>
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-medium">{formatQty(rec.quantity)}</td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{new Date(rec.requiredBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{formatCost(rec.costImpact)}</td>
                  <td className="py-2 px-2 text-green-700 dark:text-green-400 font-medium">+{rec.serviceUplift.toFixed(1)}%</td>
                  <td className="py-2 px-2"><StatusPill label={rec.confidence} /></td>
                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{rec.owner}</td>
                  <td className="py-2 px-2">
                    <StatusPill label={isApproved ? 'Approved' : rec.status} />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={(e) => handleApprove(e, rec.id)}
                      className={`p-1 rounded-md transition-colors ${
                        isApproved
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                          : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                      }`}
                      title={isApproved ? 'Revoke approval' : 'Approve action'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </SectionWrapper>
  );
}
