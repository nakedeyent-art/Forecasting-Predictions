export type DecisionDomain =
  | "Business"
  | "Investment"
  | "Career"
  | "Purchase"
  | "Strategy"
  | "Startup"
  | "Personal";

export type RiskTolerance = "Conservative" | "Balanced" | "Aggressive";

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
  confidenceScore: number;
  evidenceStrength: number;
  keyRisks: string[];
  keyOpportunities: string[];
  nextSteps: string[];
};

export type PredictionDraft = {
  statement: string;
  probability: number;
  dueDate: string;
};

export type DecisionAnalysis = {
  id: string;
  generatedAt: string;
  decomposition: Decomposition;
  evidence: EvidenceCitation[];
  scenarios: ForecastScenario[];
  probability: ProbabilityUpdate;
  simulation: SimulationSummary;
  debate: DebateView[];
  riskMatrix: RiskItem[];
  report: DecisionReport;
  prediction: PredictionDraft;
};

export type JournalPrediction = PredictionDraft & {
  id: string;
  title: string;
  createdAt: string;
  outcome?: boolean;
};
