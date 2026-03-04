import { NIIN_CATALOG } from './mockNiins';

function unique(arr: string[]): string[] {
  return [...new Set(arr)].sort();
}

export const platformOptions = unique(NIIN_CATALOG.flatMap((n) => n.platforms));
export const commodityGroupOptions = unique(NIIN_CATALOG.map((n) => n.commodityGroup));
export const supplierOptions = unique(NIIN_CATALOG.map((n) => n.supplier));
export const echelonOptions = unique(NIIN_CATALOG.map((n) => n.echelon));
export const horizonOptions = ['2y', '5y', '10y', '20y'] as const;
