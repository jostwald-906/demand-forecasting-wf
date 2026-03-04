export interface NiinRecord {
  id: string;
  niin: string;
  nomenclature: string;
  platforms: string[];
  commodityGroup: string;
  supplier: string;
  echelon: string;
  criticalityFlag: boolean; // MICAP
  singleSource: boolean;
  leadTimeDays: number;
  unitCost: number;
}

export interface OperationalData {
  onHand: number;
  onOrder: number;
  backorders: number;
  demand90d: number;
  demand12mo: number;
}

export interface RiskData {
  stockoutProb90d: number;
  stockoutProb24mo: number;
  firstProjectedStockout: string | null;
  serviceLevelActual: number;
  serviceLevelPolicy: number;
  confidenceScore: 'High' | 'Medium' | 'Low';
}
