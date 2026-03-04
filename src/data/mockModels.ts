export interface ForecastModel {
  id: string;
  name: string;
  type: string;
  mape: number;
  weight: number;
  color: string;
  sparkline: number[];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function getModelsForNiin(niinId: string): ForecastModel[] {
  const seed = parseInt(niinId.replace('niin-', ''), 10) || 1;
  const rand = seededRandom(seed * 31);

  const baseSparkline = (offset: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const base = 10 + seed % 20;
      return Math.round((base + Math.sin((i + offset) * 0.5) * 3 + (rand() - 0.5) * 4) * 10) / 10;
    });

  const models: ForecastModel[] = [
    {
      id: 'arima',
      name: 'ARIMA(2,1,2)',
      type: 'Statistical',
      mape: 8 + (seed * 3 % 12),
      weight: 25 + (seed % 20),
      color: '#3b82f6',
      sparkline: baseSparkline(0),
    },
    {
      id: 'xgboost',
      name: 'XGBoost',
      type: 'Machine Learning',
      mape: 6 + (seed * 7 % 10),
      weight: 35 + (seed * 3 % 20),
      color: '#22c55e',
      sparkline: baseSparkline(1),
    },
    {
      id: 'lstm',
      name: 'LSTM Neural Net',
      type: 'Deep Learning',
      mape: 9 + (seed * 11 % 14),
      weight: 20 + (seed * 5 % 15),
      color: '#f59e0b',
      sparkline: baseSparkline(2),
    },
    {
      id: 'prophet',
      name: 'Prophet',
      type: 'Bayesian',
      mape: 10 + (seed * 13 % 12),
      weight: 20 - (seed % 15),
      color: '#8b5cf6',
      sparkline: baseSparkline(3),
    },
  ];

  // Normalize weights to 100
  const totalWeight = models.reduce((s, m) => s + Math.max(5, m.weight), 0);
  models.forEach((m) => {
    m.weight = Math.round((Math.max(5, m.weight) / totalWeight) * 100);
  });

  // Sort by weight descending
  models.sort((a, b) => b.weight - a.weight);

  return models;
}
