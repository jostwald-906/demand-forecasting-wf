export interface RebalanceCandidate {
  sourceBase: string;
  availableQty: number;
  transferTimeDays: number;
  condition: 'Serviceable' | 'Awaiting Inspection' | 'In Repair';
  estimatedCost: number;
}

const CANDIDATES: Record<string, RebalanceCandidate[]> = {
  'niin-1': [
    { sourceBase: 'Travis AFB', availableQty: 12, transferTimeDays: 5, condition: 'Serviceable', estimatedCost: 240 },
    { sourceBase: 'Hill AFB', availableQty: 8, transferTimeDays: 7, condition: 'Serviceable', estimatedCost: 320 },
    { sourceBase: 'Tinker AFB', availableQty: 3, transferTimeDays: 4, condition: 'Awaiting Inspection', estimatedCost: 180 },
  ],
  'niin-3': [
    { sourceBase: 'Warner Robins ALC', availableQty: 45, transferTimeDays: 6, condition: 'Serviceable', estimatedCost: 150 },
    { sourceBase: 'Ogden ALC', availableQty: 30, transferTimeDays: 8, condition: 'Serviceable', estimatedCost: 200 },
  ],
  'niin-5': [
    { sourceBase: 'DLA Richmond', availableQty: 800, transferTimeDays: 3, condition: 'Serviceable', estimatedCost: 50 },
    { sourceBase: 'DLA San Joaquin', availableQty: 1200, transferTimeDays: 5, condition: 'Serviceable', estimatedCost: 75 },
  ],
  'niin-7': [
    { sourceBase: 'Tinker AFB', availableQty: 6, transferTimeDays: 5, condition: 'Serviceable', estimatedCost: 280 },
    { sourceBase: 'Oklahoma City ALC', availableQty: 4, transferTimeDays: 6, condition: 'Serviceable', estimatedCost: 320 },
  ],
  'niin-9': [
    { sourceBase: 'Hill AFB', availableQty: 8, transferTimeDays: 4, condition: 'Serviceable', estimatedCost: 200 },
    { sourceBase: 'Robins AFB', availableQty: 5, transferTimeDays: 7, condition: 'Awaiting Inspection', estimatedCost: 350 },
  ],
  'niin-11': [
    { sourceBase: 'Warner Robins ALC', availableQty: 20, transferTimeDays: 5, condition: 'Serviceable', estimatedCost: 180 },
  ],
  'niin-13': [
    { sourceBase: 'Ogden ALC', availableQty: 25, transferTimeDays: 6, condition: 'Serviceable', estimatedCost: 120 },
    { sourceBase: 'DLA Distribution', availableQty: 40, transferTimeDays: 4, condition: 'Serviceable', estimatedCost: 90 },
  ],
  'niin-15': [
    { sourceBase: 'Tinker AFB', availableQty: 10, transferTimeDays: 5, condition: 'Serviceable', estimatedCost: 250 },
  ],
  'niin-19': [
    { sourceBase: 'Hill AFB', availableQty: 4, transferTimeDays: 4, condition: 'Serviceable', estimatedCost: 200 },
    { sourceBase: 'Travis AFB', availableQty: 3, transferTimeDays: 6, condition: 'In Repair', estimatedCost: 280 },
  ],
  'niin-20': [
    { sourceBase: 'McConnell AFB', availableQty: 2, transferTimeDays: 3, condition: 'Serviceable', estimatedCost: 600 },
  ],
};

export function getRebalanceCandidates(niinId: string): RebalanceCandidate[] {
  return CANDIDATES[niinId] ?? [];
}
