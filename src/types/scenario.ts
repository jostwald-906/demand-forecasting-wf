export interface ScenarioParams {
  failureRateMultiplier: number;
  utilizationMultiplier: number;
  leadTimeShockDays: number;
  capacityCapPercent: number;
  seasonalityStrength: number;
}

export interface ScenarioOutputs {
  baselineStockoutProb90d: number;
  scenarioStockoutProb90d: number;
  deltaSpend: number;
  deltaServiceLevel: number;
  deltaRecommendedBuyQty: number;
}

export const DEFAULT_SCENARIO_PARAMS: ScenarioParams = {
  failureRateMultiplier: 1.0,
  utilizationMultiplier: 1.0,
  leadTimeShockDays: 0,
  capacityCapPercent: 100,
  seasonalityStrength: 1.0,
};
