import type { SimulationSummary } from "@/lib/types";

export function SimulationChart({ simulation }: { simulation: SimulationSummary }) {
  const values = simulation.samples;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Monte Carlo</h2>
        <span className="text-xs text-[var(--muted)]">{simulation.iterations.toLocaleString()} runs</span>
      </div>
      <div className="flex h-32 items-end gap-1">
        {values.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="min-w-1 flex-1 rounded-t-sm bg-[var(--accent-2)]"
            style={{ height: `${18 + ((value - min) / range) * 82}%` }}
            title={`Utility ${value}`}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
        <span className="rounded-md bg-[var(--panel-strong)] p-2">P10 {simulation.p10}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">P50 {simulation.p50}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">P90 {simulation.p90}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">EV {simulation.expectedValue}</span>
      </div>
    </div>
  );
}
