import type { DecisionAnalysis } from "./types";

export function parseDecisionAnalysis(value: unknown): DecisionAnalysis {
  const analysis = value as DecisionAnalysis;
  if (
    !analysis ||
    typeof analysis.id !== "string" ||
    typeof analysis.generatedAt !== "string" ||
    !analysis.report ||
    !analysis.probability ||
    !analysis.simulation ||
    !Array.isArray(analysis.evidence) ||
    !Array.isArray(analysis.scenarios) ||
    !Array.isArray(analysis.actions)
  ) {
    throw new Error("Oracle API returned an invalid analysis shape.");
  }
  return analysis;
}
