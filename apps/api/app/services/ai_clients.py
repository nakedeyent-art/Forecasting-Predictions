from __future__ import annotations

import json
import os
from typing import Any

from app.models import DecisionRequest


async def maybe_generate_ai_overlay(
    request: DecisionRequest, baseline: dict[str, Any]
) -> dict[str, Any] | None:
    """Optionally asks OpenAI for a concise report overlay.

    The deterministic engine remains the source of truth for local development.
    This path is disabled unless USE_AI_ANALYSIS is set to true and an API key is
    available.
    """

    if os.getenv("USE_AI_ANALYSIS", "false").lower() not in {"1", "true", "yes"}:
        return None
    if not os.getenv("OPENAI_API_KEY"):
        return None

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI()
        model = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
        response = await client.responses.create(
            model=model,
            input=[
                {
                    "role": "developer",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "You are Oracle, a decision intelligence analyst. "
                                "Return concise JSON only. Improve the recommendation "
                                "without changing numeric probabilities."
                            ),
                        }
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": json.dumps(
                                {
                                    "decision_request": request.model_dump(),
                                    "baseline_report": baseline.get("report", {}),
                                }
                            ),
                        }
                    ],
                },
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "oracle_report_overlay",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["recommendation", "nextSteps"],
                        "properties": {
                            "recommendation": {"type": "string"},
                            "nextSteps": {
                                "type": "array",
                                "items": {"type": "string"},
                                "minItems": 3,
                                "maxItems": 5,
                            },
                        },
                    },
                }
            },
            temperature=0.2,
            store=False,
        )
        payload = json.loads(response.output_text)
        if isinstance(payload, dict):
            return payload
    except Exception:
        return None
    return None
