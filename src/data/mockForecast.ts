import type { ForecastPoint } from '@/types';

function generateMonthlyDates(startYear: number, startMonth: number, count: number): string[] {
  const dates: string[] = [];
  let y = startYear;
  let m = startMonth;
  for (let i = 0; i < count; i++) {
    dates.push(`${y}-${String(m).padStart(2, '0')}-01`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return dates;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface ForecastConfig {
  baseDemand: number;
  seasonalAmplitude: number;
  growthRate: number;
  noiseLevel: number;
  seed: number;
}

const FORECAST_CONFIGS: Record<string, ForecastConfig> = {
  'niin-1':  { baseDemand: 8, seasonalAmplitude: 3, growthRate: 0.002, noiseLevel: 1.5, seed: 42 },
  'niin-2':  { baseDemand: 2, seasonalAmplitude: 0.5, growthRate: 0.001, noiseLevel: 0.4, seed: 99 },
  'niin-3':  { baseDemand: 60, seasonalAmplitude: 15, growthRate: 0.003, noiseLevel: 8, seed: 137 },
  'niin-4':  { baseDemand: 1.2, seasonalAmplitude: 0.3, growthRate: 0.004, noiseLevel: 0.3, seed: 256 },
  'niin-5':  { baseDemand: 1060, seasonalAmplitude: 200, growthRate: 0.001, noiseLevel: 80, seed: 512 },
  'niin-6':  { baseDemand: 1.7, seasonalAmplitude: 0.4, growthRate: 0.005, noiseLevel: 0.3, seed: 777 },
  'niin-7':  { baseDemand: 3.5, seasonalAmplitude: 0.8, growthRate: 0.003, noiseLevel: 0.6, seed: 1001 },
  'niin-8':  { baseDemand: 1.0, seasonalAmplitude: 0.2, growthRate: 0.001, noiseLevel: 0.2, seed: 1002 },
  'niin-9':  { baseDemand: 5.5, seasonalAmplitude: 1.5, growthRate: 0.002, noiseLevel: 1.0, seed: 1003 },
  'niin-10': { baseDemand: 0.5, seasonalAmplitude: 0.1, growthRate: 0.002, noiseLevel: 0.1, seed: 1004 },
  'niin-11': { baseDemand: 16, seasonalAmplitude: 4, growthRate: 0.002, noiseLevel: 2.5, seed: 1005 },
  'niin-12': { baseDemand: 1.3, seasonalAmplitude: 0.3, growthRate: 0.001, noiseLevel: 0.3, seed: 1006 },
  'niin-13': { baseDemand: 26, seasonalAmplitude: 8, growthRate: 0.003, noiseLevel: 4, seed: 1007 },
  'niin-14': { baseDemand: 1.0, seasonalAmplitude: 0.2, growthRate: 0.004, noiseLevel: 0.2, seed: 1008 },
  'niin-15': { baseDemand: 7, seasonalAmplitude: 2, growthRate: 0.002, noiseLevel: 1.2, seed: 1009 },
  'niin-16': { baseDemand: 1.5, seasonalAmplitude: 0.3, growthRate: 0.003, noiseLevel: 0.3, seed: 1010 },
  'niin-17': { baseDemand: 2.5, seasonalAmplitude: 0.6, growthRate: 0.002, noiseLevel: 0.5, seed: 1011 },
  'niin-18': { baseDemand: 1.5, seasonalAmplitude: 0.3, growthRate: 0.003, noiseLevel: 0.3, seed: 1012 },
  'niin-19': { baseDemand: 3.3, seasonalAmplitude: 0.8, growthRate: 0.001, noiseLevel: 0.6, seed: 1013 },
  'niin-20': { baseDemand: 1.0, seasonalAmplitude: 0.2, growthRate: 0.003, noiseLevel: 0.2, seed: 1014 },
};

const HISTORY_MONTHS = 60;
const FORECAST_MONTHS = 240;
const TODAY_INDEX = HISTORY_MONTHS;

export function getBaselineForecast(niinId: string): ForecastPoint[] {
  const config = FORECAST_CONFIGS[niinId];
  if (!config) return [];

  const rand = seededRandom(config.seed);
  const dates = generateMonthlyDates(2021, 3, HISTORY_MONTHS + FORECAST_MONTHS);
  const points: ForecastPoint[] = [];

  for (let i = 0; i < dates.length; i++) {
    const monthIndex = i;
    const seasonal = config.seasonalAmplitude * Math.sin((2 * Math.PI * monthIndex) / 12);
    const trend = config.baseDemand * (1 + config.growthRate * monthIndex);
    const noise = (rand() - 0.5) * 2 * config.noiseLevel;
    const value = Math.max(0, Math.round((trend + seasonal + noise) * 10) / 10);

    const isHistory = i < TODAY_INDEX;
    const monthsAhead = i - TODAY_INDEX;
    const bandWidth = isHistory
      ? 0
      : config.baseDemand * 0.15 * Math.sqrt(Math.max(1, monthsAhead));

    points.push({
      date: dates[i],
      historical: isHistory ? value : null,
      forecast: isHistory ? null : value,
      confidenceLow: isHistory ? null : Math.max(0, Math.round((value - bandWidth) * 10) / 10),
      confidenceHigh: isHistory ? null : Math.round((value + bandWidth) * 10) / 10,
    });
  }

  return points;
}

export function getHorizonMonths(horizon: string): number {
  switch (horizon) {
    case '2y': return 24;
    case '5y': return 60;
    case '10y': return 120;
    case '20y': return 240;
    default: return 60;
  }
}

export function sliceForecastByHorizon(
  data: ForecastPoint[],
  horizon: string
): ForecastPoint[] {
  const forecastMonths = getHorizonMonths(horizon);
  return data.slice(0, TODAY_INDEX + forecastMonths);
}
