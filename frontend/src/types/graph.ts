export interface GraphSummary {
  totalTransactions: number;
  uniqueWallets: number;
  totalVolume: number;
  anomalyCount: number;
  overallRiskScore: number;
}

export interface NodeData {
  id: string;
  label: string;
  inDegree: number;
  outDegree: number;
  totalReceived: number;
  totalSent: number;
  anomalyType: string;
  riskScore: number;
  color: string;
  confidence: number;
}

export interface EdgeTransaction {
  txHash: string;
  amount: number;
  timestamp: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  transactionCount: number;
  totalAmount: number;
  edgeThickness: number;
  isHighFrequency: boolean;
  transactions: EdgeTransaction[];
}

export interface DetectedAnomaly {
  wallet: string;
  type: string;
  confidence: number;
  riskScore: number;
}

export interface AnalysisResponse {
  summary: GraphSummary;
  nodes: NodeData[];
  edges: EdgeData[];
  detectedAnomalies: DetectedAnomaly[];
}
