import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { searchNiins, getNiinById, filterNiinCatalog } from '@/data';
import type { NiinRecord } from '@/types';

export default function NiinSelector() {
  const { selectedNiinId, filters } = useAppState();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NiinRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNiin = selectedNiinId ? getNiinById(selectedNiinId) : null;

  const activeFilters = useMemo(() => ({
    platform: filters.platform,
    commodityGroup: filters.commodityGroup,
    supplier: filters.supplier,
    echelon: filters.echelon,
  }), [filters.platform, filters.commodityGroup, filters.supplier, filters.echelon]);

  const filteredCatalog = useMemo(() => filterNiinCatalog(activeFilters), [activeFilters]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length > 0) {
      const matches = searchNiins(value, activeFilters);
      setResults(matches);
      setIsOpen(matches.length > 0);
    } else {
      setResults(filteredCatalog);
      setIsOpen(true);
    }
    setHighlightIndex(-1);
  }, [activeFilters, filteredCatalog]);

  const handleFocus = useCallback(() => {
    if (query.length > 0) {
      const matches = searchNiins(query, activeFilters);
      setResults(matches);
      setIsOpen(matches.length > 0);
    } else {
      setResults(filteredCatalog);
      setIsOpen(true);
    }
  }, [query, activeFilters, filteredCatalog]);

  const handleSelect = useCallback(
    (niin: NiinRecord) => {
      dispatch({ type: 'SELECT_NIIN', niinId: niin.id });
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [dispatch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        handleSelect(results[highlightIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [isOpen, results, highlightIndex, handleSelect]
  );

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-96">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={
            selectedNiin
              ? `${selectedNiin.niin} - ${selectedNiin.nomenclature}`
              : 'Click to browse NIINs or type to search...'
          }
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {query ? (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        ) : selectedNiin ? (
          <button
            onClick={() => {
              dispatch({ type: 'DESELECT_NIIN' });
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Deselect NIIN"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((niin, idx) => (
            <button
              key={niin.id}
              onClick={() => handleSelect(niin)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/30 flex items-start gap-3 ${
                idx === highlightIndex ? 'bg-primary-50 dark:bg-primary-900/30' : ''
              } ${idx !== results.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
            >
              <span className="font-mono font-medium text-gray-900 dark:text-gray-100 shrink-0 w-20">{niin.niin}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-700 dark:text-gray-300 block truncate">{niin.nomenclature}</span>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {niin.platforms.slice(0, 3).map((p) => (
                    <span key={p} className="text-[10px] px-1.5 py-0 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{p}</span>
                  ))}
                  {niin.criticalityFlag && (
                    <span className="text-[10px] px-1.5 py-0 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">MICAP</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
