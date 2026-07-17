import type { DecisionAnalysis, DecisionRequest, SavedDecision } from "./types";
import { parseDecisionAnalysis } from "./apiValidation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Oracle API timed out after 30 seconds.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function syncSavedDecision(savedDecision: SavedDecision): Promise<void> {
  try {
    await fetch("/api/decisions/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ request: savedDecision.request, analysis: savedDecision.analysis })
    });
  } catch {
    // Local-first history remains the fallback when auth or DB is unavailable.
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
