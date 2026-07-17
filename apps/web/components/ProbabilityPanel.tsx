import type { ProbabilityUpdate } from "@/lib/types";

export function ProbabilityPanel({ probability }: { probability: ProbabilityUpdate }) {
  const rows = [
    ["Prior", probability.prior, "bg-[var(--amber)]"],
    ["Posterior", probability.posterior, "bg-[var(--accent)]"],
    ["Confidence", probability.confidence, "bg-[var(--accent-2)]"]
  ] as const;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Probability Update</h2>
        <span className="text-xs text-[var(--muted)]">LR {probability.likelihoodRatio}</span>
      </div>
      <div className="space-y-4">
        {rows.map(([label, value, color]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{label}</span>
              <span>{Math.round(value * 100)}%</span>
            </div>
            <div
              aria-label={`${label} probability`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(value * 100)}
              className="h-2 rounded-full bg-[var(--line)]"
              role="progressbar"
            >
              <div className={`h-2 rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">{probability.rationale}</p>
    </div>
  );
}
