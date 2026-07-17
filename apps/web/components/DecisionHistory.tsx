import { Clock, RotateCcw, Trash2 } from "lucide-react";
import type { SavedDecision } from "@/lib/types";

type DecisionHistoryProps = {
  decisions: SavedDecision[];
  onLoad: (decision: SavedDecision) => void;
  onDelete: (id: string) => void;
};

export function DecisionHistory({ decisions, onLoad, onDelete }: DecisionHistoryProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="size-4 text-[var(--accent-2)]" />
        <h2 className="text-base font-semibold">Decision History</h2>
      </div>
      <div className="max-h-[300px] space-y-3 overflow-auto pr-1 oracle-scrollbar">
        {decisions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Saved reports will appear here.</p>
        ) : (
          decisions.map((decision) => (
            <article key={decision.id} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{decision.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(decision.createdAt).toLocaleDateString()} · {decision.analysis.report.recommendationLevel}
                  </p>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {Math.round(decision.analysis.probability.posterior * 100)}%
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-xs font-semibold hover:bg-[var(--panel)]"
                  onClick={() => onLoad(decision)}
                  type="button"
                >
                  <RotateCcw className="size-3" />
                  Load
                </button>
                <button
                  aria-label={`Delete ${decision.title}`}
                  className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                  onClick={() => onDelete(decision.id)}
                  title="Delete saved report"
                  type="button"
                >
                  <Trash2 className="size-3 text-[var(--accent-3)]" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
