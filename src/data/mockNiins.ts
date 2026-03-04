import type { NiinRecord, OperationalData, RiskData } from '@/types';

export const NIIN_CATALOG: NiinRecord[] = [
  {
    id: 'niin-1', niin: '001234567', nomenclature: 'BEARING, ROLLER, NEEDLE',
    platforms: ['F-35A', 'F-35B'], commodityGroup: 'Bearings', supplier: 'Timken Co.',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 180, unitCost: 2450.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-2', niin: '009876543', nomenclature: 'PUMP, HYDRAULIC, VARIABLE',
    platforms: ['F-16C', 'F-16D'], commodityGroup: 'Hydraulics', supplier: 'Parker Hannifin',
    echelon: 'Intermediate', criticalityFlag: true, singleSource: false, leadTimeDays: 120, unitCost: 18750.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-3', niin: '005551234', nomenclature: 'FILTER ELEMENT, FLUID',
    platforms: ['C-130J', 'C-17A'], commodityGroup: 'Filters', supplier: 'Pall Corporation',
    echelon: 'Organizational', criticalityFlag: false, singleSource: false, leadTimeDays: 45, unitCost: 320.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-4', niin: '003217654', nomenclature: 'ACTUATOR, LINEAR, ELECTRO',
    platforms: ['AH-64E'], commodityGroup: 'Flight Controls', supplier: 'Moog Inc.',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 240, unitCost: 42100.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-5', niin: '007778899', nomenclature: 'SEAL, O-RING, SYNTHETIC',
    platforms: ['F-35A', 'F-16C', 'C-130J'], commodityGroup: 'Seals & Gaskets', supplier: 'Parker Hannifin',
    echelon: 'Organizational', criticalityFlag: false, singleSource: false, leadTimeDays: 30, unitCost: 12.5, demandProgram: 'FHP',
  },
  {
    id: 'niin-6', niin: '004443210', nomenclature: 'MODULE, ELECTRONIC CTRL',
    platforms: ['F-35A', 'F-35B', 'F-35C'], commodityGroup: 'Avionics', supplier: 'Northrop Grumman',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 365, unitCost: 87500.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-7', niin: '012459832', nomenclature: 'TURBINE BLADE, HIGH PRESSURE',
    platforms: ['F-15E', 'F-15EX'], commodityGroup: 'Engine Components', supplier: 'GE Aerospace',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 300, unitCost: 34200.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-8', niin: '008321076', nomenclature: 'GENERATOR, AC, 400HZ',
    platforms: ['C-17A', 'C-5M'], commodityGroup: 'Electrical Power', supplier: 'Honeywell',
    echelon: 'Depot', criticalityFlag: true, singleSource: false, leadTimeDays: 210, unitCost: 125000.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-9', niin: '006745123', nomenclature: 'BRAKE ASSEMBLY, WHEEL',
    platforms: ['F-16C', 'F-16D', 'F-15E'], commodityGroup: 'Landing Gear', supplier: 'Safran Landing',
    echelon: 'Intermediate', criticalityFlag: false, singleSource: false, leadTimeDays: 90, unitCost: 8400.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-10', niin: '011234098', nomenclature: 'RADAR TRANSMITTER, PULSE',
    platforms: ['F-22A'], commodityGroup: 'Avionics', supplier: 'Raytheon',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 420, unitCost: 215000.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-11', niin: '002876541', nomenclature: 'HOSE ASSEMBLY, FUEL',
    platforms: ['AH-64E', 'UH-60M', 'CH-47F'], commodityGroup: 'Fuel Systems', supplier: 'Eaton Aerospace',
    echelon: 'Organizational', criticalityFlag: false, singleSource: false, leadTimeDays: 60, unitCost: 1850.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-12', niin: '009012345', nomenclature: 'CANOPY, TRANSPARENCY, FORWARD',
    platforms: ['F-16C', 'F-16D'], commodityGroup: 'Airframe', supplier: 'GKN Aerospace',
    echelon: 'Depot', criticalityFlag: false, singleSource: true, leadTimeDays: 270, unitCost: 67000.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-13', niin: '005678901', nomenclature: 'TIRE, PNEUMATIC, AIRCRAFT',
    platforms: ['C-130J', 'C-17A', 'C-5M'], commodityGroup: 'Landing Gear', supplier: 'Michelin Aircraft',
    echelon: 'Organizational', criticalityFlag: false, singleSource: false, leadTimeDays: 21, unitCost: 4200.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-14', niin: '013456789', nomenclature: 'DISPLAY UNIT, HEAD-UP',
    platforms: ['F-35A', 'F-35B', 'F-35C'], commodityGroup: 'Avionics', supplier: 'BAE Systems',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 330, unitCost: 178000.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-15', niin: '007890123', nomenclature: 'VALVE, SOLENOID, FUEL',
    platforms: ['F-15E', 'F-15EX', 'F-16C'], commodityGroup: 'Fuel Systems', supplier: 'Parker Hannifin',
    echelon: 'Intermediate', criticalityFlag: false, singleSource: false, leadTimeDays: 75, unitCost: 3600.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-16', niin: '010987654', nomenclature: 'ROTOR BLADE, MAIN',
    platforms: ['UH-60M', 'UH-60L'], commodityGroup: 'Rotor Systems', supplier: 'Sikorsky',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 360, unitCost: 245000.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-17', niin: '006543210', nomenclature: 'STARTER, ENGINE, PNEUMATIC',
    platforms: ['F-15E', 'F-15EX'], commodityGroup: 'Engine Components', supplier: 'Honeywell',
    echelon: 'Intermediate', criticalityFlag: true, singleSource: false, leadTimeDays: 150, unitCost: 52000.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-18', niin: '008765432', nomenclature: 'CIRCUIT CARD ASSY, PROCESSOR',
    platforms: ['F-22A', 'F-35A'], commodityGroup: 'Avionics', supplier: 'L3Harris',
    echelon: 'Depot', criticalityFlag: true, singleSource: false, leadTimeDays: 200, unitCost: 95000.0, demandProgram: 'WSS',
  },
  {
    id: 'niin-19', niin: '004567890', nomenclature: 'HEAT EXCHANGER, OIL',
    platforms: ['C-130J', 'KC-135R'], commodityGroup: 'Environmental', supplier: 'Collins Aerospace',
    echelon: 'Intermediate', criticalityFlag: false, singleSource: false, leadTimeDays: 110, unitCost: 14500.0, demandProgram: 'FHP',
  },
  {
    id: 'niin-20', niin: '011876543', nomenclature: 'MISSILE LAUNCHER RAIL',
    platforms: ['F-16C', 'F-15E', 'F-35A'], commodityGroup: 'Weapons Systems', supplier: 'Raytheon',
    echelon: 'Depot', criticalityFlag: true, singleSource: true, leadTimeDays: 280, unitCost: 156000.0, demandProgram: 'WSS',
  },
];

const BASELINE_OPERATIONAL: Record<string, OperationalData> = {
  'niin-1':  { onHand: 42, onOrder: 18, backorders: 3, demand90d: 24, demand12mo: 96 },
  'niin-2':  { onHand: 8, onOrder: 4, backorders: 0, demand90d: 6, demand12mo: 22 },
  'niin-3':  { onHand: 320, onOrder: 150, backorders: 0, demand90d: 180, demand12mo: 720 },
  'niin-4':  { onHand: 3, onOrder: 2, backorders: 1, demand90d: 4, demand12mo: 14 },
  'niin-5':  { onHand: 5400, onOrder: 2000, backorders: 0, demand90d: 3200, demand12mo: 12800 },
  'niin-6':  { onHand: 5, onOrder: 3, backorders: 2, demand90d: 6, demand12mo: 20 },
  'niin-7':  { onHand: 12, onOrder: 6, backorders: 2, demand90d: 10, demand12mo: 38 },
  'niin-8':  { onHand: 4, onOrder: 2, backorders: 0, demand90d: 3, demand12mo: 10 },
  'niin-9':  { onHand: 28, onOrder: 12, backorders: 0, demand90d: 16, demand12mo: 64 },
  'niin-10': { onHand: 2, onOrder: 1, backorders: 1, demand90d: 2, demand12mo: 6 },
  'niin-11': { onHand: 85, onOrder: 40, backorders: 0, demand90d: 50, demand12mo: 200 },
  'niin-12': { onHand: 6, onOrder: 3, backorders: 0, demand90d: 4, demand12mo: 15 },
  'niin-13': { onHand: 120, onOrder: 60, backorders: 0, demand90d: 80, demand12mo: 320 },
  'niin-14': { onHand: 4, onOrder: 2, backorders: 1, demand90d: 3, demand12mo: 12 },
  'niin-15': { onHand: 35, onOrder: 15, backorders: 0, demand90d: 20, demand12mo: 80 },
  'niin-16': { onHand: 6, onOrder: 4, backorders: 2, demand90d: 5, demand12mo: 18 },
  'niin-17': { onHand: 10, onOrder: 5, backorders: 1, demand90d: 8, demand12mo: 30 },
  'niin-18': { onHand: 7, onOrder: 3, backorders: 0, demand90d: 5, demand12mo: 18 },
  'niin-19': { onHand: 15, onOrder: 8, backorders: 0, demand90d: 10, demand12mo: 40 },
  'niin-20': { onHand: 3, onOrder: 2, backorders: 1, demand90d: 3, demand12mo: 10 },
};

const BASELINE_RISK: Record<string, RiskData> = {
  'niin-1':  { stockoutProb90d: 38, stockoutProb24mo: 72, firstProjectedStockout: '2026-08-15', serviceLevelActual: 88, serviceLevelPolicy: 95, confidenceScore: 'Medium' },
  'niin-2':  { stockoutProb90d: 15, stockoutProb24mo: 45, firstProjectedStockout: '2027-03-01', serviceLevelActual: 93, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-3':  { stockoutProb90d: 5, stockoutProb24mo: 12, firstProjectedStockout: null, serviceLevelActual: 98, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-4':  { stockoutProb90d: 65, stockoutProb24mo: 89, firstProjectedStockout: '2026-06-01', serviceLevelActual: 72, serviceLevelPolicy: 95, confidenceScore: 'Low' },
  'niin-5':  { stockoutProb90d: 2, stockoutProb24mo: 8, firstProjectedStockout: null, serviceLevelActual: 99, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-6':  { stockoutProb90d: 78, stockoutProb24mo: 95, firstProjectedStockout: '2026-05-15', serviceLevelActual: 65, serviceLevelPolicy: 95, confidenceScore: 'Low' },
  'niin-7':  { stockoutProb90d: 55, stockoutProb24mo: 80, firstProjectedStockout: '2026-07-01', serviceLevelActual: 78, serviceLevelPolicy: 95, confidenceScore: 'Medium' },
  'niin-8':  { stockoutProb90d: 22, stockoutProb24mo: 50, firstProjectedStockout: '2027-06-01', serviceLevelActual: 90, serviceLevelPolicy: 95, confidenceScore: 'Medium' },
  'niin-9':  { stockoutProb90d: 8, stockoutProb24mo: 25, firstProjectedStockout: null, serviceLevelActual: 96, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-10': { stockoutProb90d: 82, stockoutProb24mo: 97, firstProjectedStockout: '2026-05-01', serviceLevelActual: 58, serviceLevelPolicy: 95, confidenceScore: 'Low' },
  'niin-11': { stockoutProb90d: 10, stockoutProb24mo: 30, firstProjectedStockout: null, serviceLevelActual: 95, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-12': { stockoutProb90d: 18, stockoutProb24mo: 42, firstProjectedStockout: '2027-09-01', serviceLevelActual: 92, serviceLevelPolicy: 95, confidenceScore: 'Medium' },
  'niin-13': { stockoutProb90d: 3, stockoutProb24mo: 10, firstProjectedStockout: null, serviceLevelActual: 99, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-14': { stockoutProb90d: 70, stockoutProb24mo: 92, firstProjectedStockout: '2026-06-15', serviceLevelActual: 68, serviceLevelPolicy: 95, confidenceScore: 'Low' },
  'niin-15': { stockoutProb90d: 12, stockoutProb24mo: 35, firstProjectedStockout: '2027-12-01', serviceLevelActual: 94, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-16': { stockoutProb90d: 60, stockoutProb24mo: 85, firstProjectedStockout: '2026-07-15', serviceLevelActual: 74, serviceLevelPolicy: 95, confidenceScore: 'Low' },
  'niin-17': { stockoutProb90d: 42, stockoutProb24mo: 68, firstProjectedStockout: '2026-09-01', serviceLevelActual: 82, serviceLevelPolicy: 95, confidenceScore: 'Medium' },
  'niin-18': { stockoutProb90d: 20, stockoutProb24mo: 48, firstProjectedStockout: '2027-04-01', serviceLevelActual: 91, serviceLevelPolicy: 95, confidenceScore: 'Medium' },
  'niin-19': { stockoutProb90d: 6, stockoutProb24mo: 18, firstProjectedStockout: null, serviceLevelActual: 97, serviceLevelPolicy: 95, confidenceScore: 'High' },
  'niin-20': { stockoutProb90d: 75, stockoutProb24mo: 93, firstProjectedStockout: '2026-06-01', serviceLevelActual: 62, serviceLevelPolicy: 95, confidenceScore: 'Low' },
};

export function getOperationalData(niinId: string): OperationalData | null {
  return BASELINE_OPERATIONAL[niinId] ?? null;
}

export function getRiskData(niinId: string): RiskData | null {
  return BASELINE_RISK[niinId] ?? null;
}

export function getNiinById(niinId: string): NiinRecord | null {
  return NIIN_CATALOG.find((n) => n.id === niinId) ?? null;
}

export interface NiinFilters {
  platform: string | null;
  commodityGroup: string | null;
  supplier: string | null;
  echelon: string | null;
  demandProgram: string | null;
}

export function filterNiinCatalog(filters: NiinFilters): NiinRecord[] {
  return NIIN_CATALOG.filter((n) => {
    if (filters.platform && !n.platforms.includes(filters.platform)) return false;
    if (filters.commodityGroup && n.commodityGroup !== filters.commodityGroup) return false;
    if (filters.supplier && n.supplier !== filters.supplier) return false;
    if (filters.echelon && n.echelon !== filters.echelon) return false;
    if (filters.demandProgram && n.demandProgram !== filters.demandProgram) return false;
    return true;
  });
}

export function searchNiins(query: string, filters?: NiinFilters): NiinRecord[] {
  const catalog = filters ? filterNiinCatalog(filters) : NIIN_CATALOG;
  if (!query) return catalog;
  const q = query.toLowerCase();
  return catalog.filter(
    (n) =>
      n.niin.includes(q) ||
      n.nomenclature.toLowerCase().includes(q) ||
      n.platforms.some((p) => p.toLowerCase().includes(q)) ||
      n.commodityGroup.toLowerCase().includes(q)
  );
}
