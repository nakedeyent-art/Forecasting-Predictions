import { Check, CircleSlash, RotateCcw, Target, Trash2 } from "lucide-react";
import { calibrationSummary } from "@/lib/calibration";
import type { JournalPrediction } from "@/lib/types";

type PredictionJournalProps = {
  predictions: JournalPrediction[];
  onResolve: (id: string, outcome: boolean) => void;
  onVoid: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PredictionJournal({ predictions, onResolve, onVoid, onReopen, onDelete }: PredictionJournalProps) {
  const summary = calibrationSummary(predictions);

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[var(--accent)]" />
          <h2 className="text-base font-semibold">Prediction Journal</h2>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {summary.label} {summary.score ?? ""}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Resolved</p>
          <p className="mt-1 text-xl font-semibold">{summary.resolved}</p>
        </div>
        <div className="rounded-md bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Open</p>
          <p className="mt-1 text-xl font-semibold">{summary.open}</p>
        </div>
        <div className="rounded-md bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Voided</p>
          <p className="mt-1 text-xl font-semibold">{summary.voided}</p>
        </div>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">{summary.recommendation}</p>
      <div className="mb-4 grid gap-2 text-xs md:grid-cols-4">
        {summary.bins.map((bin) => (
          <div key={bin.label} className="rounded-md border border-[var(--line)] p-2">
            <p className="font-semibold">{bin.label}</p>
            <p className="mt-1 text-[var(--muted)]">
              {bin.count ? `${Math.round((bin.hitRate ?? 0) * 100)}% hit · ${bin.count}` : "No data"}
            </p>
          </div>
        ))}
      </div>
      <div className="max-h-[360px] space-y-3 overflow-auto pr-1 oracle-scrollbar">
        {predictions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No saved predictions yet.</p>
        ) : (
          predictions.map((prediction) => (
            <article key={prediction.id} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{prediction.title}</p>
                <span className="text-xs text-[var(--muted)]">{Math.round(prediction.probability * 100)}%</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{prediction.statement}</p>
              {prediction.status === "void" ? (
                <p className="mt-2 text-xs text-[var(--accent-3)]">Voided from calibration.</p>
              ) : null}
              {typeof prediction.outcome === "boolean" ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Resolved {prediction.outcome ? "true" : "false"}
                  {prediction.resolvedAt ? ` on ${new Date(prediction.resolvedAt).toLocaleDateString()}` : ""}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--muted)]">Due {prediction.dueDate}</span>
                <div className="flex gap-1">
                  <button
                    aria-label={`Resolve ${prediction.title} true`}
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onResolve(prediction.id, true)}
                    title="Resolve true"
                    type="button"
                  >
                    <Check className="size-4 text-[var(--accent)]" />
                  </button>
                  <button
                    aria-label={`Resolve ${prediction.title} false`}
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onResolve(prediction.id, false)}
                    title="Resolve false"
                    type="button"
                  >
                    <CircleSlash className="size-4 text-[var(--accent-3)]" />
                  </button>
                  <button
                    aria-label={`Reopen ${prediction.title}`}
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onReopen(prediction.id)}
                    title="Reopen prediction"
                    type="button"
                  >
                    <RotateCcw className="size-4 text-[var(--accent-2)]" />
                  </button>
                  <button
                    aria-label={`Void ${prediction.title}`}
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onVoid(prediction.id)}
                    title="Void from calibration"
                    type="button"
                  >
                    <CircleSlash className="size-4 text-[var(--amber)]" />
                  </button>
                  <button
                    aria-label={`Delete ${prediction.title}`}
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onDelete(prediction.id)}
                    title="Delete prediction"
                    type="button"
                  >
                    <Trash2 className="size-4 text-[var(--accent-3)]" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
