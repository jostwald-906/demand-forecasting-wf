import type { ForecastPoint } from '@/types';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export interface MonteCarloResult {
  paths: number[][];         // numPaths x forecastLength
  p10: number[];
  p50: number[];
  p90: number[];
  breachCount: number;       // paths that breach safety stock
  totalPaths: number;
  breachQuarter: string | null;
}

export function runMonteCarlo(
  forecast: ForecastPoint[],
  niinSeed: number,
  safetyStockLevel: number,
  startingInventory: number,
  quarterlyReceipts: number,
  numPaths: number = 50,
): MonteCarloResult {
  // Only simulate forecast period (non-null forecast values)
  const forecastPoints = forecast.filter((p) => p.forecast !== null);
  if (forecastPoints.length === 0) {
    return { paths: [], p10: [], p50: [], p90: [], breachCount: 0, totalPaths: numPaths, breachQuarter: null };
  }

  const forecastValues = forecastPoints.map((p) => p.forecast!);
  const forecastLength = forecastValues.length;
  const monthlyReceipts = quarterlyReceipts / 3;

  // Generate simulation paths
  const paths: number[][] = [];
  let breachCount = 0;
  let earliestBreachIdx = forecastLength;

  for (let pathIdx = 0; pathIdx < numPaths; pathIdx++) {
    const rand = seededRandom(niinSeed * 1000 + pathIdx * 7 + 13);
    const path: number[] = [];
    let cumInventory = startingInventory;
    let breached = false;

    for (let i = 0; i < forecastLength; i++) {
      const base = forecastValues[i];
      // Random perturbation: normal-ish distribution via Box-Muller
      const u1 = rand();
      const u2 = rand();
      const z = Math.sqrt(-2 * Math.log(Math.max(0.001, u1))) * Math.cos(2 * Math.PI * u2);

      // Variance increases with time horizon
      const timeScale = Math.sqrt(1 + i * 0.05);
      const noise = z * base * 0.15 * timeScale;
      const simulated = Math.max(0, Math.round((base + noise) * 10) / 10);
      path.push(simulated);

      // Inventory physics: consume simulated demand, receive monthly receipts
      cumInventory = cumInventory - simulated + monthlyReceipts;
      if (cumInventory < safetyStockLevel && !breached) {
        breached = true;
        if (i < earliestBreachIdx) earliestBreachIdx = i;
      }
    }
    paths.push(path);
    if (breached) breachCount++;
  }

  // Compute percentiles
  const p10: number[] = [];
  const p50: number[] = [];
  const p90: number[] = [];

  for (let i = 0; i < forecastLength; i++) {
    const col = paths.map((p) => p[i]).sort((a, b) => a - b);
    p10.push(col[Math.floor(col.length * 0.1)] ?? 0);
    p50.push(col[Math.floor(col.length * 0.5)] ?? 0);
    p90.push(col[Math.floor(col.length * 0.9)] ?? 0);
  }

  // Determine breach quarter
  let breachQuarter: string | null = null;
  if (earliestBreachIdx < forecastLength) {
    const breachDate = forecastPoints[earliestBreachIdx]?.date;
    if (breachDate) {
      const d = new Date(breachDate);
      const q = Math.floor(d.getMonth() / 3) + 1;
      breachQuarter = `Q${q} ${d.getFullYear()}`;
    }
  }

  return { paths, p10, p50, p90, breachCount, totalPaths: numPaths, breachQuarter };
}
