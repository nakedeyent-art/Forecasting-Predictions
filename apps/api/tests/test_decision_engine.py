from app.models import CalibrationRequest, DecisionRequest, PredictionResult
from app.services.decision_engine import _horizon_delta, build_analysis, score_calibration


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
    assert round(sum(scenario.probability for scenario in analysis.scenarios), 4) == 1
    assert 0 <= analysis.probability.posterior <= 1
    assert analysis.simulation.iterations == 5000
    assert analysis.simulation.loss_probability >= 0
    assert len(analysis.debate) == 8
    assert len(analysis.risk_matrix) == 4
    assert analysis.report.next_steps
    assert analysis.report.what_would_change_mind
    assert analysis.actions
    assert analysis.research_status == "illustrative"
    assert all(not item.is_real for item in analysis.evidence)


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


def test_horizon_delta_respects_units_and_amounts() -> None:
    assert _horizon_delta("3 years").days == 1095
    assert _horizon_delta("2 quarters").days == 182
    assert _horizon_delta("4 weeks").days == 28
    assert _horizon_delta("45 days").days == 45


def test_likelihood_ratio_stays_bounded() -> None:
    request = DecisionRequest(
        title="Test risky move",
        domain="Startup",
        decision="Decide whether to pursue an expensive risky launch with uncertain demand.",
        constraints=["Keep downside bounded"],
        time_horizon="90 days",
        risk_tolerance="Balanced",
        success_metric="Pilot clears threshold",
    )
    analysis = build_analysis(request)

    assert 0.55 <= analysis.probability.likelihood_ratio <= 1.85
    assert 0 <= analysis.probability.posterior <= 1
