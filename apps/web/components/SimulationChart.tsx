import type { SimulationSummary } from "@/lib/types";

export function SimulationChart({ simulation }: { simulation: SimulationSummary }) {
  const values = simulation.samples;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binCount = 16;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    low: min + (range / binCount) * index,
    high: min + (range / binCount) * (index + 1),
    count: 0
  }));
  for (const value of values) {
    const index = Math.min(binCount - 1, Math.max(0, Math.floor(((value - min) / range) * binCount)));
    bins[index].count += 1;
  }
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Monte Carlo</h2>
        <span className="text-xs text-[var(--muted)]">{simulation.iterations.toLocaleString()} runs</span>
      </div>
      <div className="flex h-32 items-end gap-1" aria-label="Monte Carlo outcome histogram">
        {bins.map((bin, index) => (
          <div
            key={`${bin.low}-${index}`}
            className="min-w-1 flex-1 rounded-t-sm bg-[var(--accent-2)]"
            style={{ height: `${18 + (bin.count / maxCount) * 82}%` }}
            title={`${Math.round(bin.low)} to ${Math.round(bin.high)}: ${bin.count} samples`}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        <span className="rounded-md bg-[var(--panel-strong)] p-2">P10 {simulation.p10}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">P50 {simulation.p50}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">P90 {simulation.p90}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">EV {simulation.expectedValue}</span>
        <span className="rounded-md bg-[var(--panel-strong)] p-2">Loss {Math.round(simulation.lossProbability * 100)}%</span>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Expected shortfall: {simulation.expectedShortfall}. This is the average of the worst 10% simulated outcomes.
      </p>
    </div>
  );
}
