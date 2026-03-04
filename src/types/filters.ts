export type Horizon = '2y' | '5y' | '10y' | '20y';
export type Granularity = 'monthly' | 'quarterly' | 'annual';
export type DisplayMode = 'units' | 'dollars';

export interface FilterState {
  platform: string | null;
  commodityGroup: string | null;
  supplier: string | null;
  echelon: string | null;
  horizon: Horizon;
}

export const DEFAULT_FILTERS: FilterState = {
  platform: null,
  commodityGroup: null,
  supplier: null,
  echelon: null,
  horizon: '5y',
};
