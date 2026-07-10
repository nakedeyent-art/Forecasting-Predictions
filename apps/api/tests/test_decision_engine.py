from app.models import CalibrationRequest, DecisionRequest, PredictionResult
from app.services.decision_engine import build_analysis, score_calibration


def test_build_analysis_returns_full_decision_report() -> None:
    request = DecisionRequest(
        title="Launch a premium forecasting workspace",
        domain="Startup",
        decision=(
            "Decide whether to launch a premium forecasting workspace for operators. "
            "Demand is uncertain and the initial build may be expensive."
        ),
        constraints=["Ship within 90 days", "Keep initial burn under control"],
        time_horizon="6 months",
        budget="$25,000",
        risk_tolerance="Balanced",
        success_metric="20 paying teams",
    )

    analysis = build_analysis(request)

    assert analysis.decomposition.goal.startswith("Decide whether")
    assert len(analysis.evidence) == 5
    assert len(analysis.scenarios) == 4
    assert 0 <= analysis.probability.posterior <= 1
    assert analysis.simulation.iterations == 5000
    assert len(analysis.debate) == 7
    assert len(analysis.risk_matrix) == 4
    assert analysis.report.next_steps


def test_score_calibration_uses_brier_score() -> None:
    payload = CalibrationRequest(
        predictions=[
            PredictionResult(statement="A", probability=0.8, outcome=True),
            PredictionResult(statement="B", probability=0.7, outcome=False),
        ]
    )

    score = score_calibration(payload)

    assert score.count == 2
    assert score.brier_score == 0.265
