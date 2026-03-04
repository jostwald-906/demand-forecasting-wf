import { useEffect } from 'react';
import { useAppState, useAppDispatch, useSelectedNiinData } from '@/context/AppContext';
import { Search } from 'lucide-react';
import AggregatedView from './AggregatedView';
import NiinMetadataCard from './NiinMetadataCard';
import OperationalTiles from './OperationalTiles';
import RiskTiles from './RiskTiles';
import ForecastChart from './ForecastChart';
import InventoryBars from './InventoryBars';
import BreachTable from './BreachTable';
import RecommendedActions from './RecommendedActions';
import ScenarioBanner from './ScenarioBanner';
import ForecastDrivers from './ForecastDrivers';
import ForecastQuality from './ForecastQuality';
import CostServiceWidget from './CostServiceWidget';
import ReadinessImpact from './ReadinessImpact';
import AnomalyFeed from './AnomalyFeed';
import SupplierRiskCard from './SupplierRiskCard';
import CausalGraph from './CausalGraph';

export default function NiinControlView() {
  const { selectedNiinId, isLoading, displayMode, simulatedError, filters } = useAppState();
  const dispatch = useAppDispatch();
  const data = useSelectedNiinData();

  // Simulate loading delay when NIIN changes
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_LOADING', loading: false });
    }, 800);
    return () => clearTimeout(timer);
  }, [isLoading, dispatch]);

  const handleRetry = () => {
    dispatch({ type: 'SIMULATE_ERROR', error: null });
  };

  const hasActiveFilters =
    filters.platform !== null ||
    filters.commodityGroup !== null ||
    filters.supplier !== null ||
    filters.echelon !== null ||
    filters.demandProgram !== null;

  if (!selectedNiinId) {
    if (hasActiveFilters) {
      return <AggregatedView />;
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
        <Search className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Select a NIIN to begin analysis</p>
        <p className="text-sm mt-1">Use the search bar above or select a filter to view aggregated demand</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {['NIIN Snapshot', 'Demand Forecast', 'Supply Sufficiency', 'Recommended Actions'].map((section) => (
          <div key={section} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            </div>
            <div className="p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error affects specific sections when simulated
  const errorMsg = simulatedError ?? undefined;

  return (
    <div className="space-y-6">
      {/* Scenario active banner */}
      <ScenarioBanner />

      {/* B: NIIN Snapshot header */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <NiinMetadataCard niin={data.niin} />
        </div>
        <div className="col-span-4">
          <OperationalTiles
            data={data.operational}
            unitCost={data.niin.unitCost}
            displayMode={displayMode}
          />
        </div>
        <div className="col-span-4">
          <RiskTiles risk={data.risk} baselineRisk={data.baselineRisk} />
        </div>
      </div>

      {/* Readiness Impact Translator */}
      <ReadinessImpact
        risk={data.risk}
        baselineRisk={data.baselineRisk}
        operational={data.operational}
        niin={data.niin}
      />

      {/* C: Forecast chart + controls */}
      <ForecastChart
        forecast={data.forecast}
        unitCost={data.niin.unitCost}
        niinId={data.niin.id}
        error={errorMsg}
        onRetry={handleRetry}
      />

      {/* Demand Signal Anomalies */}
      <AnomalyFeed niinId={data.niin.id} />

      {/* G: Credibility panels + Supplier Intelligence (collapsed) */}
      <div className="grid grid-cols-3 gap-4">
        <ForecastDrivers niinId={data.niin.id} />
        <ForecastQuality niinId={data.niin.id} />
        <SupplierRiskCard niin={data.niin} />
      </div>

      {/* Causal AI Explainability */}
      <CausalGraph niinId={data.niin.id} />

      {/* D: Supply sufficiency */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <InventoryBars data={data.inventory} unitCost={data.niin.unitCost} error={errorMsg} onRetry={handleRetry} />
        </div>
        <div className="col-span-2">
          <BreachTable data={data.breachRows} unitCost={data.niin.unitCost} />
        </div>
      </div>

      {/* E: Recommendations */}
      <RecommendedActions data={data.recommendations} niinId={data.niin.id} error={errorMsg} onRetry={handleRetry} />

      {/* E4: Cost vs Service tradeoff */}
      <CostServiceWidget data={data.recommendations} />
    </div>
  );
}
