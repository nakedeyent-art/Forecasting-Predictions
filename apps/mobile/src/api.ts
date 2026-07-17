import type { DecisionAnalysis, DecisionRequest } from "@/lib/types";
import { parseDecisionAnalysis } from "@/lib/apiValidation";

const API_BASE = import.meta.env.VITE_ORACLE_API_BASE_URL ?? "http://localhost:8001";

export async function analyzeDecision(request: DecisionRequest): Promise<DecisionAnalysis> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}/api/decisions/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await responseError(response));
    }

    return parseDecisionAnalysis(await response.json());
  } finally {
    window.clearTimeout(timeout);
  }
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown; error?: string };
    if (typeof payload.error === "string") {
      return payload.error;
    }
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      return payload.detail
        .map((item) => {
          if (typeof item === "object" && item && "msg" in item) {
            return String(item.msg);
          }
          return String(item);
        })
        .join("; ");
    }
  } catch {
    // Fall through to status message.
  }
  return `Oracle API returned ${response.status}`;
}
