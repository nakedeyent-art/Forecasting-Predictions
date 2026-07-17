from __future__ import annotations

import logging
import os
import time
import uuid

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models import CalibrationRequest, CalibrationResponse, DecisionAnalysis, DecisionRequest
from app.services.ai_clients import maybe_generate_ai_overlay
from app.services.decision_engine import build_analysis, score_calibration
from app.services.research_engine import gather_research

logger = logging.getLogger("oracle.api")
logging.basicConfig(level=os.getenv("ORACLE_LOG_LEVEL", "INFO"))

MAX_BODY_BYTES = int(os.getenv("ORACLE_MAX_BODY_BYTES", "1048576"))


def _cors_origins() -> list[str]:
    configured = os.getenv("ORACLE_CORS_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ]

app = FastAPI(
    title="Oracle API",
    summary="Decision intelligence, forecasting, simulation, and calibration API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


@app.middleware("http")
async def request_guard(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_BYTES:
        return JSONResponse(
            {"detail": f"Request body exceeds {MAX_BODY_BYTES} bytes.", "requestId": request_id},
            status_code=413,
            headers={"X-Request-ID": request_id},
        )

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "elapsed_ms": elapsed_ms,
        },
    )
    return response


@app.get("/health")
def health() -> dict[str, str | bool | int | list[str]]:
    return {
        "status": "ok",
        "service": "oracle-api",
        "version": app.version,
        "aiOverlayEnabled": os.getenv("USE_AI_ANALYSIS", "false").lower() in {"1", "true", "yes"},
        "liveResearchConfigured": bool(os.getenv("TAVILY_API_KEY") or os.getenv("EXA_API_KEY")),
        "corsOrigins": _cors_origins(),
        "maxBodyBytes": MAX_BODY_BYTES,
    }


@app.post("/api/decisions/analyze", response_model=DecisionAnalysis)
async def analyze_decision(payload: DecisionRequest) -> DecisionAnalysis:
    evidence, research_status = await gather_research(payload)
    analysis = build_analysis(payload, evidence=evidence, research_status=research_status)
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
