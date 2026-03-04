import type { InventoryBucket, BreachRow } from '@/types';

interface InventoryConfig {
  startingOnHand: number;
  quarterlyReceipts: number;
  quarterlyDemand: number;
  safetyStock: number;
  receiptVariance: number;
  demandVariance: number;
  seed: number;
}

const INVENTORY_CONFIGS: Record<string, InventoryConfig> = {
  'niin-1': { startingOnHand: 42, quarterlyReceipts: 20, quarterlyDemand: 24, safetyStock: 15, receiptVariance: 4, demandVariance: 5, seed: 111 },
  'niin-2': { startingOnHand: 8, quarterlyReceipts: 5, quarterlyDemand: 5.5, safetyStock: 4, receiptVariance: 1, demandVariance: 1, seed: 222 },
  'niin-3': { startingOnHand: 320, quarterlyReceipts: 180, quarterlyDemand: 180, safetyStock: 100, receiptVariance: 20, demandVariance: 25, seed: 333 },
  'niin-4': { startingOnHand: 3, quarterlyReceipts: 3, quarterlyDemand: 3.5, safetyStock: 2, receiptVariance: 1, demandVariance: 0.5, seed: 444 },
  'niin-5': { startingOnHand: 5400, quarterlyReceipts: 3200, quarterlyDemand: 3200, safetyStock: 1600, receiptVariance: 300, demandVariance: 400, seed: 555 },
  'niin-6':  { startingOnHand: 5, quarterlyReceipts: 4, quarterlyDemand: 5, safetyStock: 3, receiptVariance: 1, demandVariance: 1, seed: 666 },
  'niin-7':  { startingOnHand: 12, quarterlyReceipts: 8, quarterlyDemand: 10, safetyStock: 5, receiptVariance: 2, demandVariance: 2, seed: 2001 },
  'niin-8':  { startingOnHand: 4, quarterlyReceipts: 3, quarterlyDemand: 2.5, safetyStock: 2, receiptVariance: 1, demandVariance: 0.5, seed: 2002 },
  'niin-9':  { startingOnHand: 28, quarterlyReceipts: 16, quarterlyDemand: 16, safetyStock: 10, receiptVariance: 3, demandVariance: 3, seed: 2003 },
  'niin-10': { startingOnHand: 2, quarterlyReceipts: 1, quarterlyDemand: 1.5, safetyStock: 1, receiptVariance: 0.5, demandVariance: 0.3, seed: 2004 },
  'niin-11': { startingOnHand: 85, quarterlyReceipts: 50, quarterlyDemand: 50, safetyStock: 25, receiptVariance: 8, demandVariance: 10, seed: 2005 },
  'niin-12': { startingOnHand: 6, quarterlyReceipts: 4, quarterlyDemand: 3.8, safetyStock: 3, receiptVariance: 1, demandVariance: 0.8, seed: 2006 },
  'niin-13': { startingOnHand: 120, quarterlyReceipts: 80, quarterlyDemand: 80, safetyStock: 40, receiptVariance: 12, demandVariance: 15, seed: 2007 },
  'niin-14': { startingOnHand: 4, quarterlyReceipts: 3, quarterlyDemand: 3, safetyStock: 2, receiptVariance: 1, demandVariance: 0.5, seed: 2008 },
  'niin-15': { startingOnHand: 35, quarterlyReceipts: 20, quarterlyDemand: 20, safetyStock: 10, receiptVariance: 4, demandVariance: 4, seed: 2009 },
  'niin-16': { startingOnHand: 6, quarterlyReceipts: 4, quarterlyDemand: 4.5, safetyStock: 3, receiptVariance: 1, demandVariance: 1, seed: 2010 },
  'niin-17': { startingOnHand: 10, quarterlyReceipts: 7, quarterlyDemand: 7.5, safetyStock: 4, receiptVariance: 2, demandVariance: 1.5, seed: 2011 },
  'niin-18': { startingOnHand: 7, quarterlyReceipts: 5, quarterlyDemand: 4.5, safetyStock: 3, receiptVariance: 1, demandVariance: 1, seed: 2012 },
  'niin-19': { startingOnHand: 15, quarterlyReceipts: 10, quarterlyDemand: 10, safetyStock: 5, receiptVariance: 2, demandVariance: 2, seed: 2013 },
  'niin-20': { startingOnHand: 3, quarterlyReceipts: 2, quarterlyDemand: 2.5, safetyStock: 2, receiptVariance: 0.5, demandVariance: 0.5, seed: 2014 },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const QUARTERS = [
  'Q2 2026', 'Q3 2026', 'Q4 2026',
  'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027',
  'Q1 2028', 'Q2 2028', 'Q3 2028', 'Q4 2028',
  'Q1 2029',
];

export function getBaselineInventory(niinId: string): InventoryBucket[] {
  const config = INVENTORY_CONFIGS[niinId];
  if (!config) return [];

  const rand = seededRandom(config.seed);
  const buckets: InventoryBucket[] = [];
  let currentInventory = config.startingOnHand;

  for (const period of QUARTERS) {
    const receipts = Math.max(0, Math.round(config.quarterlyReceipts + (rand() - 0.5) * 2 * config.receiptVariance));
    const consumption = Math.max(0, Math.round(config.quarterlyDemand + (rand() - 0.5) * 2 * config.demandVariance));
    const ending = currentInventory + receipts - consumption;
    const isBreach = ending < config.safetyStock;

    buckets.push({
      period,
      startingInventory: Math.round(currentInventory),
      receipts,
      consumption,
      endingInventory: Math.round(ending),
      safetyStock: config.safetyStock,
      isBreach,
    });

    currentInventory = Math.max(0, ending);
  }

  return buckets;
}

export function deriveBreachRows(buckets: InventoryBucket[]): BreachRow[] {
  return buckets.map((b, i) => {
    const available = b.startingInventory + b.receipts;
    const shortfall = available - b.consumption;
    const prob = shortfall < 0 ? Math.min(95, Math.abs(shortfall) / b.consumption * 100) : Math.max(0, (1 - shortfall / (b.consumption || 1)) * 50);
    const daysToImpact = b.isBreach ? Math.max(5, 90 - i * 8) : 999;

    return {
      period: b.period,
      forecastDemand: b.consumption,
      availableSupply: available,
      gap: shortfall,
      stockoutProbability: Math.round(prob),
      daysToImpact: b.isBreach ? daysToImpact : 999,
    };
  });
}
