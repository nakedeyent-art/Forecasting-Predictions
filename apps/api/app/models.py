from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


DecisionDomain = Literal[
    "Business",
    "Investment",
    "Career",
    "Purchase",
    "Strategy",
    "Startup",
    "Personal",
]
RiskTolerance = Literal["Conservative", "Balanced", "Aggressive"]
EvidenceDirection = Literal["supports", "contradicts", "neutral"]
ResearchStatus = Literal["live", "illustrative", "unavailable"]
ActionStatus = Literal["open", "done", "void"]

ShortText = Annotated[str, Field(min_length=1, max_length=240)]
MediumText = Annotated[str, Field(min_length=1, max_length=1200)]


class DecisionRequest(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    domain: DecisionDomain = "Strategy"
    decision: str = Field(min_length=20, max_length=5000)
    constraints: list[ShortText] = Field(default_factory=list, max_length=12)
    time_horizon: str = Field(default="90 days", max_length=80)
    budget: str | None = Field(default=None, max_length=80)
    risk_tolerance: RiskTolerance = "Balanced"
    success_metric: str = Field(default="Expected value", max_length=140)


class Decomposition(BaseModel):
    goal: str
    constraints: list[str]
    assumptions: list[str]
    risks: list[str]
    unknowns: list[str]
    stakeholders: list[str]
    success_metrics: list[str]


class EvidenceCitation(BaseModel):
    title: str
    source: str
    url: str
    source_type: str = Field(alias="sourceType")
    confidence: float = Field(ge=0, le=1)
    direction: EvidenceDirection = "neutral"
    summary: str
    is_real: bool = Field(alias="isReal")
    retrieved_at: str | None = Field(default=None, alias="retrievedAt")
    evidence_note: str = Field(alias="evidenceNote")


class ForecastScenario(BaseModel):
    name: Literal["Best case", "Base case", "Worst case", "Black swan"]
    probability: float = Field(ge=0, le=1)
    payoff: float
    narrative: str
    leading_indicators: list[str] = Field(alias="leadingIndicators")


class ProbabilityUpdate(BaseModel):
    prior: float = Field(ge=0, le=1)
    likelihood_ratio: float = Field(alias="likelihoodRatio", gt=0)
    posterior: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    rationale: str


class SimulationSummary(BaseModel):
    iterations: int
    expected_value: float = Field(alias="expectedValue")
    success_probability: float = Field(alias="successProbability", ge=0, le=1)
    loss_probability: float = Field(alias="lossProbability", ge=0, le=1)
    expected_shortfall: float = Field(alias="expectedShortfall")
    p10: float
    p50: float
    p90: float
    samples: list[float]


class DebateView(BaseModel):
    specialist: str
    stance: str
    confidence: float = Field(ge=0, le=1)
    argument: str


class RiskItem(BaseModel):
    name: str
    probability: int = Field(ge=1, le=5)
    impact: int = Field(ge=1, le=5)
    mitigation: str
    confidence: float = Field(ge=0, le=1)


class DecisionReport(BaseModel):
    recommendation: str
    recommendation_level: Literal["Proceed", "Evidence sprint", "Do not commit"] = Field(alias="recommendationLevel")
    confidence_score: float = Field(alias="confidenceScore", ge=0, le=1)
    evidence_strength: float = Field(alias="evidenceStrength", ge=0, le=1)
    key_risks: list[str] = Field(alias="keyRisks")
    key_opportunities: list[str] = Field(alias="keyOpportunities")
    next_steps: list[str] = Field(alias="nextSteps")
    what_would_change_mind: list[str] = Field(alias="whatWouldChangeMind")


class CalibrationInsight(BaseModel):
    resolved_count: int = Field(alias="resolvedCount")
    open_count: int = Field(alias="openCount")
    brier_score: float | None = Field(default=None, alias="brierScore")
    reliability: str
    recommendation: str


class ActionItem(BaseModel):
    id: str
    title: str
    owner: str
    due_date: str = Field(alias="dueDate")
    status: ActionStatus = "open"
    rationale: str


class PredictionDraft(BaseModel):
    statement: str
    probability: float = Field(ge=0, le=1)
    due_date: str = Field(alias="dueDate")


class DecisionAnalysis(BaseModel):
    id: str
    generated_at: datetime = Field(alias="generatedAt")
    research_status: ResearchStatus = Field(alias="researchStatus")
    decomposition: Decomposition
    evidence: list[EvidenceCitation]
    scenarios: list[ForecastScenario]
    probability: ProbabilityUpdate
    simulation: SimulationSummary
    debate: list[DebateView]
    risk_matrix: list[RiskItem] = Field(alias="riskMatrix")
    report: DecisionReport
    prediction: PredictionDraft
    calibration: CalibrationInsight
    actions: list[ActionItem]


class PredictionResult(BaseModel):
    statement: str = Field(min_length=1, max_length=600)
    probability: float = Field(ge=0, le=1)
    outcome: bool


class CalibrationRequest(BaseModel):
    predictions: list[PredictionResult] = Field(default_factory=list, max_length=1000)


class CalibrationResponse(BaseModel):
    brier_score: float = Field(alias="brierScore")
    count: int
    interpretation: str
