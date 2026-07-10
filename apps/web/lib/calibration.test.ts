import { describe, expect, it } from "vitest";
import { brierScore, calibrationLabel } from "./calibration";
import type { JournalPrediction } from "./types";

const basePrediction = {
  id: "p1",
  title: "Decision",
  statement: "Outcome happens",
  dueDate: "2026-12-31",
  createdAt: "2026-01-01"
};

describe("calibration", () => {
  it("returns null when no predictions are resolved", () => {
    expect(
      brierScore([{ ...basePrediction, probability: 0.7 } satisfies JournalPrediction])
    ).toBeNull();
  });

  it("calculates the mean Brier score", () => {
    const predictions: JournalPrediction[] = [
      { ...basePrediction, id: "a", probability: 0.8, outcome: true },
      { ...basePrediction, id: "b", probability: 0.7, outcome: false }
    ];

    expect(brierScore(predictions)).toBe(0.265);
  });

  it("labels calibration quality", () => {
    expect(calibrationLabel(null)).toBe("Pending");
    expect(calibrationLabel(0.05)).toBe("Excellent");
    expect(calibrationLabel(0.3)).toBe("Needs work");
  });
});
