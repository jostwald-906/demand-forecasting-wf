export interface InventoryBucket {
  period: string;
  startingInventory: number;
  receipts: number;
  consumption: number;
  endingInventory: number;
  safetyStock: number;
  isBreach: boolean;
}

export interface BreachRow {
  period: string;
  forecastDemand: number;
  availableSupply: number;
  gap: number;
  stockoutProbability: number;
  daysToImpact: number;
}
