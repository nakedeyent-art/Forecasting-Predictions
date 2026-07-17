import type { JournalPrediction } from "./types";

export function brierScore(predictions: JournalPrediction[]): number | null {
  const resolved = predictions.filter((prediction) => prediction.status !== "void" && typeof prediction.outcome === "boolean");
  if (resolved.length === 0) {
    return null;
  }

  const total = resolved.reduce((sum, prediction) => {
    const outcome = prediction.outcome ? 1 : 0;
    return sum + Math.pow(prediction.probability - outcome, 2);
  }, 0);

  return Number((total / resolved.length).toFixed(3));
}

export function calibrationSummary(predictions: JournalPrediction[]) {
  const active = predictions.filter((prediction) => prediction.status !== "void");
  const resolved = active.filter((prediction) => typeof prediction.outcome === "boolean");
  const open = active.length - resolved.length;
  const score = brierScore(active);
  const bins = [
    { label: "0-25%", min: 0, max: 0.25 },
    { label: "26-50%", min: 0.25, max: 0.5 },
    { label: "51-75%", min: 0.5, max: 0.75 },
    { label: "76-100%", min: 0.75, max: 1.01 }
  ].map((bin) => {
    const items = resolved.filter((prediction) => prediction.probability >= bin.min && prediction.probability < bin.max);
    const hitRate = items.length
      ? items.filter((prediction) => prediction.outcome === true).length / items.length
      : null;
    return { label: bin.label, count: items.length, hitRate };
  });

  return {
    score,
    label: calibrationLabel(score),
    resolved: resolved.length,
    open,
    voided: predictions.length - active.length,
    bins,
    recommendation:
      resolved.length < 10
        ? "Resolve at least 10 predictions before trusting calibration trends."
        : score !== null && score > 0.25
          ? "Reduce confidence until predictions match observed outcomes."
          : "Keep recording explicit probabilities and resolution notes."
  };
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
