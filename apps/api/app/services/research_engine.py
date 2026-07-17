from __future__ import annotations

import os
from datetime import UTC, datetime
from typing import Any

import httpx

from app.models import DecisionRequest, EvidenceCitation, ResearchStatus


async def gather_research(request: DecisionRequest) -> tuple[list[EvidenceCitation] | None, ResearchStatus]:
    """Retrieve real research when a provider key exists.

    Tavily and Exa are optional production integrations. Local development stays
    deterministic and explicitly marks fallback evidence as illustrative.
    """

    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        citations = await _query_tavily(request, tavily_key)
        if citations:
            return citations, "live"

    exa_key = os.getenv("EXA_API_KEY")
    if exa_key:
        citations = await _query_exa(request, exa_key)
        if citations:
            return citations, "live"

    return None, "illustrative"


async def _query_tavily(request: DecisionRequest, api_key: str) -> list[EvidenceCitation]:
    query = _research_query(request)
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": 5,
                    "include_answer": False,
                    "include_raw_content": False,
                },
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    return _citations_from_results(payload.get("results", []), provider="Tavily", request=request)


async def _query_exa(request: DecisionRequest, api_key: str) -> list[EvidenceCitation]:
    query = _research_query(request)
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.post(
                "https://api.exa.ai/search",
                headers={"x-api-key": api_key, "Content-Type": "application/json"},
                json={"query": query, "numResults": 5, "useAutoprompt": True},
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    return _citations_from_results(payload.get("results", []), provider="Exa", request=request)


def _citations_from_results(
    results: list[dict[str, Any]], provider: str, request: DecisionRequest
) -> list[EvidenceCitation]:
    citations: list[EvidenceCitation] = []
    retrieved_at = datetime.now(UTC).date().isoformat()
    for result in results[:5]:
        title = str(result.get("title") or result.get("text") or "Untitled source")[:180]
        url = str(result.get("url") or "")
        if not url.startswith(("http://", "https://")):
            continue
        summary = str(result.get("content") or result.get("snippet") or result.get("text") or "Retrieved research source.")[:600]
        direction = _infer_direction(f"{title} {summary}", request)
        citations.append(
            EvidenceCitation(
                title=title,
                source=provider,
                url=url,
                sourceType="Live research",
                confidence=_score_result(title, summary, direction),
                direction=direction,
                summary=summary,
                isReal=True,
                retrievedAt=retrieved_at,
                evidenceNote="Live citation retrieved from a configured search provider.",
            )
        )
    return citations


def _research_query(request: DecisionRequest) -> str:
    return (
        f"{request.domain} decision evidence for {request.title}: "
        f"{request.success_metric}; constraints {'; '.join(request.constraints[:4])}"
    )


def _infer_direction(text: str, request: DecisionRequest) -> str:
    lowered = text.lower()
    negative = {"decline", "risk", "lawsuit", "falling", "weak", "delay", "loss", "churn", "uncertain"}
    positive = {"growth", "increase", "strong", "demand", "profit", "adoption", "tailwind", "improve"}
    if sum(word in lowered for word in positive) > sum(word in lowered for word in negative):
        return "supports"
    if sum(word in lowered for word in negative) > sum(word in lowered for word in positive):
        return "contradicts"
    if request.risk_tolerance == "Conservative" and "risk" in lowered:
        return "contradicts"
    return "neutral"


def _score_result(title: str, summary: str, direction: str) -> float:
    length_bonus = min(len(summary) / 1200, 0.12)
    direction_bonus = 0.04 if direction != "neutral" else 0
    title_bonus = 0.04 if len(title) > 20 else 0
    return round(min(0.86, 0.58 + length_bonus + direction_bonus + title_bonus), 2)
