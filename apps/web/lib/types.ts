export type DecisionDomain =
  | "Business"
  | "Investment"
  | "Career"
  | "Purchase"
  | "Strategy"
  | "Startup"
  | "Personal";

export type RiskTolerance = "Conservative" | "Balanced" | "Aggressive";
export type EvidenceDirection = "supports" | "contradicts" | "neutral";
export type ResearchStatus = "live" | "illustrative" | "unavailable";
export type ActionStatus = "open" | "done" | "void";

export type DecisionRequest = {
  title: string;
  domain: DecisionDomain;
  decision: string;
  constraints: string[];
  time_horizon: string;
  budget?: string;
  risk_tolerance: RiskTolerance;
  success_metric: string;
};

export type Decomposition = {
  goal: string;
  constraints: string[];
  assumptions: string[];
  risks: string[];
  unknowns: string[];
  stakeholders: string[];
  success_metrics: string[];
};

export type EvidenceCitation = {
  title: string;
  source: string;
  url: string;
  sourceType: string;
  confidence: number;
  direction: EvidenceDirection;
  summary: string;
  isReal: boolean;
  retrievedAt?: string | null;
  evidenceNote: string;
};

export type ForecastScenario = {
  name: "Best case" | "Base case" | "Worst case" | "Black swan";
  probability: number;
  payoff: number;
  narrative: string;
  leadingIndicators: string[];
};

export type ProbabilityUpdate = {
  prior: number;
  likelihoodRatio: number;
  posterior: number;
  confidence: number;
  rationale: string;
};

export type SimulationSummary = {
  iterations: number;
  expectedValue: number;
  successProbability: number;
  lossProbability: number;
  expectedShortfall: number;
  p10: number;
  p50: number;
  p90: number;
  samples: number[];
};

export type DebateView = {
  specialist: string;
  stance: string;
  confidence: number;
  argument: string;
};

export type RiskItem = {
  name: string;
  probability: number;
  impact: number;
  mitigation: string;
  confidence: number;
};

export type DecisionReport = {
  recommendation: string;
  recommendationLevel: "Proceed" | "Evidence sprint" | "Do not commit";
  confidenceScore: number;
  evidenceStrength: number;
  keyRisks: string[];
  keyOpportunities: string[];
  nextSteps: string[];
  whatWouldChangeMind: string[];
};

export type CalibrationInsight = {
  resolvedCount: number;
  openCount: number;
  brierScore?: number | null;
  reliability: string;
  recommendation: string;
};

export type ActionItem = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
  rationale: string;
};

export type PredictionDraft = {
  statement: string;
  probability: number;
  dueDate: string;
};

export type DecisionAnalysis = {
  id: string;
  generatedAt: string;
  researchStatus: ResearchStatus;
  decomposition: Decomposition;
  evidence: EvidenceCitation[];
  scenarios: ForecastScenario[];
  probability: ProbabilityUpdate;
  simulation: SimulationSummary;
  debate: DebateView[];
  riskMatrix: RiskItem[];
  report: DecisionReport;
  prediction: PredictionDraft;
  calibration: CalibrationInsight;
  actions: ActionItem[];
};

export type JournalPrediction = PredictionDraft & {
  id: string;
  title: string;
  createdAt: string;
  outcome?: boolean | null;
  resolvedAt?: string;
  resolutionNote?: string;
  status?: "open" | "resolved" | "void";
};

export type SavedDecision = {
  id: string;
  title: string;
  createdAt: string;
  request: DecisionRequest;
  analysis: DecisionAnalysis;
};

export type UserPreset = {
  id: string;
  label: string;
  createdAt: string;
  request: DecisionRequest;
};
