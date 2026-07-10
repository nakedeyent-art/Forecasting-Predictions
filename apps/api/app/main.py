from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import CalibrationRequest, CalibrationResponse, DecisionAnalysis, DecisionRequest
from app.services.ai_clients import maybe_generate_ai_overlay
from app.services.decision_engine import build_analysis, score_calibration

app = FastAPI(
    title="Oracle API",
    summary="Decision intelligence, forecasting, simulation, and calibration API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "oracle-api"}


@app.post("/api/decisions/analyze", response_model=DecisionAnalysis)
async def analyze_decision(payload: DecisionRequest) -> DecisionAnalysis:
    analysis = build_analysis(payload)
    overlay = await maybe_generate_ai_overlay(payload, analysis.model_dump(by_alias=True))
    if overlay:
        report = analysis.report.model_copy(
            update={
                "recommendation": overlay.get("recommendation", analysis.report.recommendation),
                "next_steps": overlay.get("nextSteps", analysis.report.next_steps),
            }
        )
        analysis = analysis.model_copy(update={"report": report})
    return analysis


@app.post("/api/predictions/score", response_model=CalibrationResponse)
def score_predictions(payload: CalibrationRequest) -> CalibrationResponse:
    return score_calibration(payload)
