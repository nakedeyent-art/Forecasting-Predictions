import type { DecisionAnalysis, DecisionRequest } from "@/lib/types";

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
      throw new Error(`Oracle API returned ${response.status}`);
    }

    return response.json() as Promise<DecisionAnalysis>;
  } finally {
    window.clearTimeout(timeout);
  }
}
