export interface ForecastPoint {
  date: string;
  historical: number | null;
  forecast: number | null;
  confidenceLow: number | null;
  confidenceHigh: number | null;
  scenarioForecast?: number | null;
}
