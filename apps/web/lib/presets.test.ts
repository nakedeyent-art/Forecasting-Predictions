import { describe, expect, it } from "vitest";
import { decisionPresets, getPresetById } from "./presets";
import type { DecisionDomain, RiskTolerance } from "./types";

const domains: DecisionDomain[] = [
  "Business",
  "Investment",
  "Career",
  "Purchase",
  "Strategy",
  "Startup",
  "Personal"
];

const riskLevels: RiskTolerance[] = ["Conservative", "Balanced", "Aggressive"];

describe("decision presets", () => {
  it("provide complete topic fields for each preset", () => {
    expect(decisionPresets.length).toBeGreaterThanOrEqual(6);

    for (const preset of decisionPresets) {
      expect(preset.label).toBeTruthy();
      expect(preset.request.title.length).toBeGreaterThan(3);
      expect(domains).toContain(preset.request.domain);
      expect(preset.request.decision.length).toBeGreaterThan(60);
      expect(preset.request.constraints.length).toBeGreaterThanOrEqual(3);
      expect(preset.request.time_horizon).toBeTruthy();
      expect(preset.request.budget).toBeTruthy();
      expect(riskLevels).toContain(preset.request.risk_tolerance);
      expect(preset.request.success_metric).toBeTruthy();
    }
  });

  it("looks up presets by id", () => {
    expect(getPresetById("investment-thesis")?.request.domain).toBe("Investment");
    expect(getPresetById("missing")).toBeUndefined();
  });
});
