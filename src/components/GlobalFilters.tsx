import { RotateCcw } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import {
  platformOptions,
  commodityGroupOptions,
  supplierOptions,
  echelonOptions,
  horizonOptions,
} from '@/data';
import type { FilterState, Horizon } from '@/types';

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string | null) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const isActive = value !== null;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={`text-sm border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          isActive ? 'border-primary-400 ring-1 ring-primary-200 dark:ring-primary-800' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function GlobalFilters() {
  const { filters, horizon } = useAppState();
  const dispatch = useAppDispatch();

  const setFilter = (key: keyof FilterState, value: string | null) => {
    dispatch({ type: 'SET_FILTER', key, value });
  };

  const hasActiveFilters =
    filters.platform !== null ||
    filters.commodityGroup !== null ||
    filters.supplier !== null ||
    filters.echelon !== null;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-end gap-4 flex-wrap">
        <FilterDropdown
          label="Platform"
          value={filters.platform}
          options={platformOptions}
          onChange={(v) => setFilter('platform', v)}
        />
        <FilterDropdown
          label="Commodity"
          value={filters.commodityGroup}
          options={commodityGroupOptions}
          onChange={(v) => setFilter('commodityGroup', v)}
        />
        <FilterDropdown
          label="Supplier"
          value={filters.supplier}
          options={supplierOptions}
          onChange={(v) => setFilter('supplier', v)}
        />
        <FilterDropdown
          label="Echelon"
          value={filters.echelon}
          options={echelonOptions}
          onChange={(v) => setFilter('echelon', v)}
        />
        <FilterDropdown
          label="Horizon"
          value={horizon}
          options={horizonOptions}
          onChange={(v) => dispatch({ type: 'SET_HORIZON', horizon: (v as Horizon) ?? '5y' })}
        />
        {hasActiveFilters && (
          <button
            onClick={() => dispatch({ type: 'RESET_FILTERS' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 mb-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
