import type { DecisionAnalysis, DecisionRequest } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

export async function analyzeDecision(request: DecisionRequest): Promise<DecisionAnalysis> {
  const response = await fetch(`${API_BASE}/api/decisions/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Oracle API returned ${response.status}`);
  }

  return response.json() as Promise<DecisionAnalysis>;
}
