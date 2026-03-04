export type ActionType = 'Buy' | 'Expedite' | 'Rebalance' | 'Alternate Source';
export type ActionStatus = 'Recommended' | 'Under Review' | 'Approved' | 'Rejected';

export interface Recommendation {
  id: string;
  actionType: ActionType;
  quantity: number;
  requiredBy: string;
  costImpact: number;
  serviceUplift: number;
  confidence: 'High' | 'Medium' | 'Low';
  owner: string;
  status: ActionStatus;
  rationale: string;
  impactIfExecuted: string;
  impactIfNotExecuted: string;
  assumptions: string[];
  breachPeriod: string;
}
