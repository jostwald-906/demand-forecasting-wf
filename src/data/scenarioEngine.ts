import type {
  ScenarioParams,
  ScenarioOutputs,
  ForecastPoint,
  RiskData,
  InventoryBucket,
  Recommendation,
} from '@/types';
import { DEFAULT_SCENARIO_PARAMS } from '@/types';

export function isScenarioModified(params: ScenarioParams): boolean {
  return (
    params.failureRateMultiplier !== DEFAULT_SCENARIO_PARAMS.failureRateMultiplier ||
    params.utilizationMultiplier !== DEFAULT_SCENARIO_PARAMS.utilizationMultiplier ||
    params.leadTimeShockDays !== DEFAULT_SCENARIO_PARAMS.leadTimeShockDays ||
    params.capacityCapPercent !== DEFAULT_SCENARIO_PARAMS.capacityCapPercent ||
    params.seasonalityStrength !== DEFAULT_SCENARIO_PARAMS.seasonalityStrength
  );
}

export function applyScenarioToForecast(
  baseline: ForecastPoint[],
  params: ScenarioParams
): ForecastPoint[] {
  // Always set scenarioForecast so the field exists for overlay rendering
  const modified = isScenarioModified(params);

  const demandMultiplier = params.failureRateMultiplier * params.utilizationMultiplier;
  // Amplify the effect so small slider changes are visible
  const amplifiedMultiplier = modified ? 1.0 + (demandMultiplier - 1.0) * 1.5 : 1.0;

  return baseline.map((pt) => {
    if (pt.forecast === null) return { ...pt, scenarioForecast: null };

    if (!modified) {
      return { ...pt, scenarioForecast: pt.forecast };
    }

    const adjustedForecast = Math.max(0, Math.round(pt.forecast * amplifiedMultiplier * 10) / 10);
    const seasonalDelta = (params.seasonalityStrength - 1.0) * pt.forecast * 0.4;
    const leadTimeImpact = (params.leadTimeShockDays / 180) * pt.forecast * 0.15;
    const capacityImpact = ((100 - params.capacityCapPercent) / 100) * pt.forecast * 0.2;
    const finalForecast = Math.max(0, Math.round((adjustedForecast + seasonalDelta + leadTimeImpact + capacityImpact) * 10) / 10);

    return {
      ...pt,
      scenarioForecast: finalForecast,
      confidenceLow: pt.confidenceLow !== null
        ? Math.max(0, Math.round(pt.confidenceLow * amplifiedMultiplier * 10) / 10)
        : null,
      confidenceHigh: pt.confidenceHigh !== null
        ? Math.round(pt.confidenceHigh * amplifiedMultiplier * 1.1 * 10) / 10
        : null,
    };
  });
}

export function applyScenarioToRisk(
  baseline: RiskData,
  params: ScenarioParams
): RiskData {
  if (!isScenarioModified(params)) return baseline;

  const riskPressure =
    (params.failureRateMultiplier - 1) * 30 +
    (params.utilizationMultiplier - 1) * 20 +
    (params.leadTimeShockDays / 180) * 25 +
    ((100 - params.capacityCapPercent) / 100) * 20;

  const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

  const prob90d = clamp(baseline.stockoutProb90d + riskPressure);
  const prob24mo = clamp(baseline.stockoutProb24mo + riskPressure * 1.3);

  const serviceHit = riskPressure * 0.4;
  const serviceLevelActual = clamp(baseline.serviceLevelActual - serviceHit);

  let firstProjectedStockout = baseline.firstProjectedStockout;
  if (riskPressure > 10 && baseline.firstProjectedStockout) {
    const d = new Date(baseline.firstProjectedStockout);
    d.setDate(d.getDate() - Math.round(riskPressure * 2));
    firstProjectedStockout = d.toISOString().split('T')[0];
  } else if (riskPressure > 20 && !baseline.firstProjectedStockout) {
    const d = new Date();
    d.setMonth(d.getMonth() + Math.max(3, 12 - Math.round(riskPressure / 5)));
    firstProjectedStockout = d.toISOString().split('T')[0];
  }

  const confidenceScore: RiskData['confidenceScore'] =
    prob90d > 60 ? 'Low' : prob90d > 25 ? 'Medium' : 'High';

  return {
    stockoutProb90d: prob90d,
    stockoutProb24mo: prob24mo,
    firstProjectedStockout: firstProjectedStockout,
    serviceLevelActual,
    serviceLevelPolicy: baseline.serviceLevelPolicy,
    confidenceScore,
  };
}

export function applyScenarioToInventory(
  baseline: InventoryBucket[],
  params: ScenarioParams
): InventoryBucket[] {
  if (!isScenarioModified(params)) return baseline;

  const demandMultiplier = params.failureRateMultiplier * params.utilizationMultiplier;
  const capacityFactor = params.capacityCapPercent / 100;
  const leadTimeImpact = params.leadTimeShockDays / 90;

  let currentInventory = baseline[0]?.startingInventory ?? 0;

  return baseline.map((bucket) => {
    const adjustedReceipts = Math.round(bucket.receipts * capacityFactor * Math.max(0.5, 1 - leadTimeImpact * 0.3));
    const adjustedConsumption = Math.round(bucket.consumption * demandMultiplier);
    const ending = currentInventory + adjustedReceipts - adjustedConsumption;
    const isBreach = ending < bucket.safetyStock;

    const result: InventoryBucket = {
      ...bucket,
      startingInventory: Math.round(currentInventory),
      receipts: adjustedReceipts,
      consumption: adjustedConsumption,
      endingInventory: Math.round(ending),
      isBreach,
    };

    currentInventory = Math.max(0, ending);
    return result;
  });
}

export function applyScenarioToRecommendations(
  baseline: Recommendation[],
  params: ScenarioParams
): Recommendation[] {
  if (!isScenarioModified(params)) return baseline;

  const demandMultiplier = params.failureRateMultiplier * params.utilizationMultiplier;

  return baseline.map((rec) => {
    const adjustedQty = Math.round(rec.quantity * demandMultiplier);
    const adjustedCost = Math.round(rec.costImpact * (adjustedQty / rec.quantity));

    return {
      ...rec,
      quantity: adjustedQty,
      costImpact: adjustedCost,
    };
  });
}

export function computeScenarioOutputs(
  baselineRisk: RiskData,
  scenarioRisk: RiskData,
  baselineRecs: Recommendation[],
  scenarioRecs: Recommendation[]
): ScenarioOutputs {
  const baselineBuyCost = baselineRecs.reduce((sum, r) => sum + r.costImpact, 0);
  const scenarioBuyCost = scenarioRecs.reduce((sum, r) => sum + r.costImpact, 0);

  const baselineBuyQty = baselineRecs
    .filter((r) => r.actionType === 'Buy')
    .reduce((sum, r) => sum + r.quantity, 0);
  const scenarioBuyQty = scenarioRecs
    .filter((r) => r.actionType === 'Buy')
    .reduce((sum, r) => sum + r.quantity, 0);

  return {
    baselineStockoutProb90d: baselineRisk.stockoutProb90d,
    scenarioStockoutProb90d: scenarioRisk.stockoutProb90d,
    deltaSpend: scenarioBuyCost - baselineBuyCost,
    deltaServiceLevel: scenarioRisk.serviceLevelActual - baselineRisk.serviceLevelActual,
    deltaRecommendedBuyQty: scenarioBuyQty - baselineBuyQty,
  };
}
