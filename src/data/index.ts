export { NIIN_CATALOG, getOperationalData, getRiskData, getNiinById, searchNiins, filterNiinCatalog } from './mockNiins';
export type { NiinFilters } from './mockNiins';
export { getBaselineForecast, sliceForecastByHorizon, getHorizonMonths, getAggregatedForecast } from './mockForecast';
export { getBaselineInventory, deriveBreachRows } from './mockInventory';
export { getBaselineRecommendations } from './mockRecommendations';
export { platformOptions, commodityGroupOptions, supplierOptions, echelonOptions, demandProgramOptions, horizonOptions } from './filterOptions';
export { getChartEvents } from './mockEvents';
export { getRebalanceCandidates } from './mockRebalance';
export type { ChartEvent } from './mockEvents';
export {
  isScenarioModified,
  applyScenarioToForecast,
  applyScenarioToRisk,
  applyScenarioToInventory,
  applyScenarioToRecommendations,
  computeScenarioOutputs,
} from './scenarioEngine';
