import type { JournalPrediction } from "./types";

export function brierScore(predictions: JournalPrediction[]): number | null {
  const resolved = predictions.filter((prediction) => typeof prediction.outcome === "boolean");
  if (resolved.length === 0) {
    return null;
  }

  const total = resolved.reduce((sum, prediction) => {
    const outcome = prediction.outcome ? 1 : 0;
    return sum + Math.pow(prediction.probability - outcome, 2);
  }, 0);

  return Number((total / resolved.length).toFixed(3));
}

export function calibrationLabel(score: number | null): string {
  if (score === null) {
    return "Pending";
  }
  if (score <= 0.08) {
    return "Excellent";
  }
  if (score <= 0.18) {
    return "Good";
  }
  if (score <= 0.25) {
    return "Mixed";
  }
  return "Needs work";
}
