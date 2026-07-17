import { GitCompareArrows } from "lucide-react";
import type { DecisionAnalysis, SavedDecision } from "@/lib/types";

export function ComparisonPanel({
  current,
  previous
}: {
  current: DecisionAnalysis | null;
  previous: SavedDecision | null;
}) {
  if (!current || !previous) {
    return null;
  }

  const previousAnalysis = previous.analysis;
  const rows = [
    ["Posterior", current.probability.posterior, previousAnalysis.probability.posterior],
    ["Success", current.simulation.successProbability, previousAnalysis.simulation.successProbability],
    ["Loss", current.simulation.lossProbability, previousAnalysis.simulation.lossProbability],
    ["Confidence", current.report.confidenceScore, previousAnalysis.report.confidenceScore]
  ] as const;

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <GitCompareArrows className="size-4 text-[var(--accent-2)]" />
        <h2 className="text-base font-semibold">Compare With Previous Report</h2>
      </div>
      <p className="mb-3 text-sm text-[var(--muted)]">Baseline: {previous.title}</p>
      <div className="grid gap-2 md:grid-cols-4">
        {rows.map(([label, currentValue, previousValue]) => {
          const delta = currentValue - previousValue;
          return (
            <div key={label} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <p className="mt-1 text-lg font-semibold">{Math.round(currentValue * 100)}%</p>
              <p className={`mt-1 text-xs ${delta >= 0 ? "text-[var(--accent)]" : "text-[var(--accent-3)]"}`}>
                {delta >= 0 ? "+" : ""}
                {Math.round(delta * 100)} pts
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
