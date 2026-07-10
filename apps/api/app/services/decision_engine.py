from __future__ import annotations

import hashlib
import random
from datetime import UTC, datetime, timedelta
from statistics import median

from app.models import (
    CalibrationRequest,
    CalibrationResponse,
    DebateView,
    DecisionAnalysis,
    DecisionReport,
    DecisionRequest,
    Decomposition,
    EvidenceCitation,
    ForecastScenario,
    PredictionDraft,
    ProbabilityUpdate,
    RiskItem,
    SimulationSummary,
)


DOMAIN_STAKEHOLDERS = {
    "Business": ["Customers", "Leadership", "Operations", "Finance"],
    "Investment": ["Investor", "Counterparties", "Regulators", "Portfolio"],
    "Career": ["User", "Family", "Manager", "Future employers"],
    "Purchase": ["Buyer", "Vendor", "Support team", "Finance"],
    "Strategy": ["Leadership", "Team", "Customers", "Competitors"],
    "Startup": ["Founders", "Customers", "Investors", "Early hires"],
    "Personal": ["User", "Family", "Community", "Future self"],
}

RISK_TOLERANCE_SHIFT = {
    "Conservative": -0.08,
    "Balanced": 0.0,
    "Aggressive": 0.06,
}


def build_analysis(request: DecisionRequest) -> DecisionAnalysis:
    seed = _stable_seed(request.title + request.decision)
    rng = random.Random(seed)
    decomposition = decompose(request)
    evidence = build_evidence(request, rng)
    probability = update_probability(request, evidence)
    scenarios = build_scenarios(request, probability.posterior)
    simulation = run_simulation(seed, request, probability.posterior)
    risks = build_risk_matrix(request, decomposition, probability.posterior)
    debate = build_debate(request, probability.posterior, risks)
    report = build_report(request, probability, risks, simulation)
    prediction = PredictionDraft(
        statement=f"{request.title} will meet '{request.success_metric}' within {request.time_horizon}.",
        probability=round(probability.posterior, 2),
        dueDate=(datetime.now(UTC) + _horizon_delta(request.time_horizon)).date().isoformat(),
    )

    return DecisionAnalysis(
        id=hashlib.sha1(f"{seed}:{datetime.now(UTC).date()}".encode()).hexdigest()[:12],
        generatedAt=datetime.now(UTC),
        decomposition=decomposition,
        evidence=evidence,
        scenarios=scenarios,
        probability=probability,
        simulation=simulation,
        debate=debate,
        riskMatrix=risks,
        report=report,
        prediction=prediction,
    )


def decompose(request: DecisionRequest) -> Decomposition:
    decision_text = request.decision.strip()
    goal = decision_text.split(".")[0][:180].strip()
    if len(goal) < 18:
        goal = f"Decide whether to pursue {request.title}"

    constraints = [item.strip() for item in request.constraints if item.strip()]
    if request.budget:
        constraints.append(f"Budget: {request.budget}")
    constraints.append(f"Time horizon: {request.time_horizon}")
    constraints = _unique(constraints)[:8]

    assumptions = [
        f"The stated success metric ({request.success_metric}) is measurable.",
        "The decision can be staged before full commitment.",
        "New evidence can update the forecast before irreversible spend.",
    ]
    if request.domain in {"Startup", "Business", "Strategy"}:
        assumptions.append("Customer demand can be tested with a narrow pilot.")
    if request.domain == "Investment":
        assumptions.append("Downside exposure can be bounded before entry.")
    if request.risk_tolerance == "Conservative":
        assumptions.append("Capital preservation is more important than upside capture.")

    risks = [
        "Evidence quality may be uneven across sources.",
        "Execution capacity may be overestimated.",
        "External market or stakeholder behavior may shift.",
    ]
    unknowns = [
        "True base rate for comparable decisions",
        "Opportunity cost of waiting",
        "Reversibility after the first commitment",
    ]

    return Decomposition(
        goal=goal,
        constraints=constraints,
        assumptions=assumptions,
        risks=risks,
        unknowns=unknowns,
        stakeholders=DOMAIN_STAKEHOLDERS[request.domain],
        success_metrics=[request.success_metric, "Expected value", "Downside containment"],
    )


def build_evidence(request: DecisionRequest, rng: random.Random) -> list[EvidenceCitation]:
    confidence_base = {
        "Government data": 0.82,
        "Market report": 0.72,
        "Academic source": 0.76,
        "Competitor signal": 0.64,
        "News": 0.58,
    }
    source_mix = [
        ("Government data", "Bureau and regulatory trend indicators", "https://www.data.gov/"),
        ("Market report", f"{request.domain} demand and pricing benchmarks", "https://www.statista.com/"),
        ("Academic source", "Base-rate and decision quality research", "https://scholar.google.com/"),
        ("Competitor signal", "Comparable alternatives and positioning", "https://www.crunchbase.com/"),
        ("News", "Recent event pressure and sentiment", "https://news.google.com/"),
    ]
    citations = []
    for source_type, title, url in source_mix:
        noise = rng.uniform(-0.04, 0.05)
        citations.append(
            EvidenceCitation(
                title=title,
                source=source_type,
                url=url,
                sourceType=source_type,
                confidence=round(_clamp(confidence_base[source_type] + noise, 0.45, 0.9), 2),
            )
        )
    return citations


def update_probability(
    request: DecisionRequest, evidence: list[EvidenceCitation]
) -> ProbabilityUpdate:
    base_prior = {
        "Business": 0.55,
        "Investment": 0.5,
        "Career": 0.58,
        "Purchase": 0.62,
        "Strategy": 0.53,
        "Startup": 0.42,
        "Personal": 0.6,
    }[request.domain]

    risk_penalty = _keyword_risk(request.decision)
    evidence_strength = sum(item.confidence for item in evidence) / len(evidence)
    prior = _clamp(base_prior + RISK_TOLERANCE_SHIFT[request.risk_tolerance] - risk_penalty, 0.15, 0.85)
    likelihood_ratio = _clamp(0.75 + evidence_strength, 0.6, 1.75)
    odds = prior / (1 - prior)
    posterior_odds = odds * likelihood_ratio
    posterior = posterior_odds / (1 + posterior_odds)

    return ProbabilityUpdate(
        prior=round(prior, 2),
        likelihoodRatio=round(likelihood_ratio, 2),
        posterior=round(_clamp(posterior, 0.08, 0.92), 2),
        confidence=round(_clamp(evidence_strength - risk_penalty / 2, 0.35, 0.86), 2),
        rationale=(
            "Posterior combines the domain base rate, stated risk tolerance, "
            "evidence confidence, and explicit uncertainty penalties."
        ),
    )


def build_scenarios(request: DecisionRequest, success_probability: float) -> list[ForecastScenario]:
    base_payoff = round(100 * success_probability, 1)
    return [
        ForecastScenario(
            name="Best case",
            probability=round(_clamp(success_probability * 0.45, 0.12, 0.38), 2),
            payoff=round(base_payoff * 1.45, 1),
            narrative="Evidence compounds, adoption is faster than expected, and the first move creates follow-on options.",
            leadingIndicators=["Fast stakeholder alignment", "Lower acquisition friction", "Early metric acceleration"],
        ),
        ForecastScenario(
            name="Base case",
            probability=round(_clamp(success_probability * 0.78, 0.32, 0.58), 2),
            payoff=base_payoff,
            narrative="The decision works if staged, measured, and adjusted when new evidence arrives.",
            leadingIndicators=["Pilot clears threshold", "Costs stay within guardrails", "Risks remain reversible"],
        ),
        ForecastScenario(
            name="Worst case",
            probability=round(_clamp((1 - success_probability) * 0.42, 0.14, 0.4), 2),
            payoff=round(base_payoff * -0.55, 1),
            narrative="Execution drag, weak evidence, or stakeholder resistance turns the opportunity into sunk cost.",
            leadingIndicators=["Slow feedback loops", "Budget pressure", "Unclear owner accountability"],
        ),
        ForecastScenario(
            name="Black swan",
            probability=round(_clamp((1 - success_probability) * 0.12, 0.03, 0.12), 2),
            payoff=round(base_payoff * -1.15, 1),
            narrative="A low-probability shock changes constraints enough to invalidate the original decision frame.",
            leadingIndicators=["Regulatory shock", "Platform dependency failure", "Counterparty surprise"],
        ),
    ]


def run_simulation(seed: int, request: DecisionRequest, success_probability: float) -> SimulationSummary:
    rng = random.Random(seed)
    volatility = {
        "Conservative": 12,
        "Balanced": 18,
        "Aggressive": 26,
    }[request.risk_tolerance]
    center = 50 + (success_probability - 0.5) * 70
    samples = []
    for _ in range(5000):
        shock = rng.triangular(-volatility * 1.4, volatility * 1.8, 0)
        samples.append(round(_clamp(center + shock, -100, 150), 1))

    sorted_samples = sorted(samples)
    chart_samples = [sorted_samples[index] for index in range(0, len(sorted_samples), 125)][:40]
    return SimulationSummary(
        iterations=len(samples),
        expectedValue=round(sum(samples) / len(samples), 1),
        successProbability=round(sum(1 for value in samples if value > 50) / len(samples), 2),
        p10=round(_percentile(sorted_samples, 0.1), 1),
        p50=round(median(sorted_samples), 1),
        p90=round(_percentile(sorted_samples, 0.9), 1),
        samples=chart_samples,
    )


def build_risk_matrix(
    request: DecisionRequest, decomposition: Decomposition, success_probability: float
) -> list[RiskItem]:
    base_probability = 4 if success_probability < 0.5 else 3
    if request.risk_tolerance == "Aggressive":
        base_probability += 1
    if request.risk_tolerance == "Conservative":
        base_probability -= 1

    risk_names = [
        ("Evidence gap", "Set a research deadline and require source triangulation."),
        ("Execution bandwidth", "Assign one accountable owner and define a weekly decision review."),
        ("Downside exposure", "Use a staged pilot with explicit stop-loss conditions."),
        ("Stakeholder friction", "Pre-wire objections with decision criteria before launch."),
    ]
    matrix = []
    for index, (name, mitigation) in enumerate(risk_names):
        matrix.append(
            RiskItem(
                name=name,
                probability=int(_clamp(base_probability + (index % 2), 1, 5)),
                impact=int(_clamp(3 + index // 2 + _keyword_risk(" ".join(decomposition.risks)) * 5, 1, 5)),
                mitigation=mitigation,
                confidence=round(_clamp(0.7 - index * 0.05, 0.48, 0.78), 2),
            )
        )
    return matrix


def build_debate(
    request: DecisionRequest, success_probability: float, risks: list[RiskItem]
) -> list[DebateView]:
    severe_risk = max(risks, key=lambda item: item.probability * item.impact)
    proceed_stance = "Proceed with staged commitment" if success_probability >= 0.58 else "Delay until evidence improves"
    return [
        DebateView(
            specialist="CEO",
            stance=proceed_stance,
            confidence=round(_clamp(success_probability, 0.35, 0.82), 2),
            argument="The strategic upside is attractive if the decision owner keeps a short feedback cycle.",
        ),
        DebateView(
            specialist="CFO",
            stance="Cap exposure before scaling",
            confidence=0.72,
            argument="The most important control is a spending gate tied to measurable progress.",
        ),
        DebateView(
            specialist="Engineer",
            stance="Prototype before committing",
            confidence=0.68,
            argument="A reversible pilot will expose operational constraints earlier than a planning cycle.",
        ),
        DebateView(
            specialist="Lawyer",
            stance="Check obligations and reversibility",
            confidence=0.64,
            argument="Document assumptions, approvals, vendor terms, and stakeholder reliance before launch.",
        ),
        DebateView(
            specialist="Investor",
            stance="Compare against opportunity cost",
            confidence=0.66,
            argument="The decision is only attractive if its expected value beats the next best alternative.",
        ),
        DebateView(
            specialist="Customer",
            stance="Demand proof of value",
            confidence=0.61,
            argument="The user-facing benefit must be obvious enough to survive switching costs.",
        ),
        DebateView(
            specialist="Risk Analyst",
            stance=f"Watch {severe_risk.name.lower()}",
            confidence=severe_risk.confidence,
            argument=f"The dominant mitigation is: {severe_risk.mitigation}",
        ),
    ]


def build_report(
    request: DecisionRequest,
    probability: ProbabilityUpdate,
    risks: list[RiskItem],
    simulation: SimulationSummary,
) -> DecisionReport:
    if probability.posterior >= 0.64:
        recommendation = "Proceed, but use a staged pilot with pre-committed kill criteria."
    elif probability.posterior >= 0.5:
        recommendation = "Run a focused evidence sprint before making the irreversible commitment."
    else:
        recommendation = "Do not commit yet; reduce uncertainty or choose a lower-risk alternative."

    key_risks = [risk.name for risk in sorted(risks, key=lambda item: item.probability * item.impact, reverse=True)[:3]]
    key_opportunities = [
        "Create decision advantage by learning faster than competitors.",
        "Convert uncertainty into staged options instead of one large bet.",
        f"Optimize for {request.success_metric} while tracking calibration.",
    ]
    next_steps = [
        "Define a reversible pilot with a single owner.",
        "Collect three external sources that test the riskiest assumption.",
        "Set a probability update date before the next spending gate.",
        "Write one measurable prediction and resolve it on the due date.",
    ]
    if simulation.p10 < 0:
        next_steps.insert(2, "Add a downside stop-loss because the left tail crosses zero.")

    return DecisionReport(
        recommendation=recommendation,
        confidenceScore=round(_clamp((probability.posterior + probability.confidence) / 2, 0.35, 0.9), 2),
        evidenceStrength=probability.confidence,
        keyRisks=key_risks,
        keyOpportunities=key_opportunities,
        nextSteps=next_steps[:5],
    )


def score_calibration(request: CalibrationRequest) -> CalibrationResponse:
    if not request.predictions:
        return CalibrationResponse(brierScore=0.0, count=0, interpretation="No resolved predictions yet.")

    scores = [
        (prediction.probability - (1.0 if prediction.outcome else 0.0)) ** 2
        for prediction in request.predictions
    ]
    brier = sum(scores) / len(scores)
    if brier <= 0.08:
        interpretation = "Excellent calibration."
    elif brier <= 0.18:
        interpretation = "Good calibration with room to sharpen confidence."
    elif brier <= 0.25:
        interpretation = "Mixed calibration; compare misses against base rates."
    else:
        interpretation = "Needs calibration work; reduce overconfidence and record assumptions."
    return CalibrationResponse(
        brierScore=round(brier, 3),
        count=len(scores),
        interpretation=interpretation,
    )


def _stable_seed(value: str) -> int:
    return int(hashlib.sha256(value.encode()).hexdigest()[:12], 16)


def _keyword_risk(text: str) -> float:
    keywords = {
        "uncertain",
        "volatile",
        "regulation",
        "regulatory",
        "lawsuit",
        "debt",
        "cash",
        "competitor",
        "deadline",
        "expensive",
        "irreversible",
        "unknown",
    }
    lowered = text.lower()
    hits = sum(1 for keyword in keywords if keyword in lowered)
    return _clamp(hits * 0.025, 0.0, 0.16)


def _percentile(values: list[float], percentile: float) -> float:
    index = int((len(values) - 1) * percentile)
    return values[index]


def _horizon_delta(value: str) -> timedelta:
    lowered = value.lower()
    if "year" in lowered:
        return timedelta(days=365)
    if "month" in lowered:
        digits = "".join(character for character in lowered if character.isdigit())
        months = int(digits) if digits else 3
        return timedelta(days=months * 30)
    if "day" in lowered:
        digits = "".join(character for character in lowered if character.isdigit())
        return timedelta(days=int(digits) if digits else 90)
    return timedelta(days=90)


def _unique(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        key = value.lower()
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
