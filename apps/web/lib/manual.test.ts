import { describe, expect, it } from "vitest";
import { glossaryTerms, manualSections } from "./manual";

describe("instruction manual", () => {
  it("covers the core app workflow", () => {
    expect(manualSections.map((section) => section.id)).toEqual([
      "workflow",
      "inputs",
      "report",
      "calibration"
    ]);

    for (const section of manualSections) {
      expect(section.title).toBeTruthy();
      expect(section.summary.length).toBeGreaterThan(30);
      expect(section.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("defines required decision intelligence terms", () => {
    const terms = glossaryTerms.map((item) => item.term);

    expect(terms).toContain("Bayesian reasoning");
    expect(terms).toContain("Brier Score");
    expect(terms).toContain("Monte Carlo simulation");
    expect(terms).toContain("p10, p50, p90");
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(12);
  });
});
