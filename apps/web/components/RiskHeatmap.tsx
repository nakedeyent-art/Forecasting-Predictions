import type { RiskItem } from "@/lib/types";

function heatColor(probability: number, impact: number) {
  const score = probability * impact;
  if (score >= 18) return "bg-[#a23b3b] text-white";
  if (score >= 12) return "bg-[#a86614] text-white";
  if (score >= 7) return "bg-[#d6b35d] text-[#171614]";
  return "bg-[#0e7c68] text-white";
}

export function RiskHeatmap({ risks }: { risks: RiskItem[] }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Risk Matrix</h2>
        <span className="text-xs text-[var(--muted)]">Impact x probability</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 25 }, (_, index) => {
          const probability = 5 - Math.floor(index / 5);
          const impact = (index % 5) + 1;
          const matches = risks.filter((risk) => risk.probability === probability && risk.impact === impact);
          return (
            <div
              key={`${probability}-${impact}`}
              className={`flex aspect-square items-center justify-center rounded-md text-xs font-semibold ${heatColor(probability, impact)}`}
              title={`Probability ${probability}, impact ${impact}`}
            >
              {matches.length ? matches.length : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-4 space-y-2">
        {risks.map((risk) => (
          <div key={risk.name} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{risk.name}</p>
              <span className="text-xs text-[var(--muted)]">P{risk.probability} / I{risk.impact}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{risk.mitigation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
