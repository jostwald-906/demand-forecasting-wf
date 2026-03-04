export interface ChartEvent {
  date: string;
  label: string;
  type: 'contract' | 'engineering' | 'retirement' | 'deployment';
  description: string;
}

const EVENTS: Record<string, ChartEvent[]> = {
  'niin-1': [
    { date: '2027-01-01', label: 'Contract Renewal', type: 'contract', description: 'Timken Co. contract renewal - pricing may change' },
    { date: '2028-06-01', label: 'Engineering Change', type: 'engineering', description: 'Bearing spec revision B3 replaces current part' },
  ],
  'niin-2': [
    { date: '2026-09-01', label: 'F-16 Deployment', type: 'deployment', description: 'Pacific surge deployment increases demand 30%' },
    { date: '2028-01-01', label: 'Contract Rebid', type: 'contract', description: 'Parker Hannifin contract rebid - new supplier possible' },
  ],
  'niin-3': [
    { date: '2027-06-01', label: 'C-130J Retirement', type: 'retirement', description: 'Block 6.1 aircraft retirement reduces demand 15%' },
  ],
  'niin-4': [
    { date: '2026-08-01', label: 'Alt Source Qual', type: 'engineering', description: 'Curtiss-Wright alternate source qualification complete' },
    { date: '2027-03-01', label: 'Design Revision', type: 'engineering', description: 'Rev C actuator with improved MTBF enters production' },
  ],
  'niin-5': [
    { date: '2027-09-01', label: 'Bulk Contract', type: 'contract', description: 'Multi-year bulk purchase agreement starts' },
  ],
  'niin-6': [
    { date: '2027-01-01', label: 'F-35 Block Buy', type: 'contract', description: 'Lot 18 contract award - increased demand expected' },
    { date: '2028-03-01', label: 'Tech Refresh', type: 'engineering', description: 'Module redesign with updated components' },
  ],
  'niin-7': [
    { date: '2027-06-01', label: 'Depot Overhaul', type: 'deployment', description: 'KC-135 programmed depot maintenance surge' },
  ],
  'niin-8': [
    { date: '2027-09-01', label: 'C-17 Drawdown', type: 'retirement', description: 'C-17 fleet reduction begins - 8 aircraft retired' },
  ],
  'niin-10': [
    { date: '2026-12-01', label: 'Elbit Qual', type: 'engineering', description: 'Alternate source qualification target completion' },
  ],
  'niin-12': [
    { date: '2027-03-01', label: 'AESA Upgrade', type: 'engineering', description: 'F-16 AESA radar upgrade changes transmitter spec' },
  ],
  'niin-14': [
    { date: '2027-06-01', label: 'MQ-9 Expansion', type: 'deployment', description: 'MQ-9 fleet expansion adds 12 aircraft' },
  ],
  'niin-20': [
    { date: '2027-01-01', label: 'Nav System Upgrade', type: 'engineering', description: 'GPS III integration requires firmware update' },
  ],
};

export function getChartEvents(niinId: string): ChartEvent[] {
  return EVENTS[niinId] ?? [];
}
