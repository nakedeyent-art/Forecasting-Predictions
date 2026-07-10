import { Check, CircleSlash, Target } from "lucide-react";
import { brierScore, calibrationLabel } from "@/lib/calibration";
import type { JournalPrediction } from "@/lib/types";

type PredictionJournalProps = {
  predictions: JournalPrediction[];
  onResolve: (id: string, outcome: boolean) => void;
};

export function PredictionJournal({ predictions, onResolve }: PredictionJournalProps) {
  const score = brierScore(predictions);
  const resolved = predictions.filter((prediction) => typeof prediction.outcome === "boolean").length;

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[var(--accent)]" />
          <h2 className="text-base font-semibold">Prediction Journal</h2>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {calibrationLabel(score)} {score ?? ""}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Resolved</p>
          <p className="mt-1 text-xl font-semibold">{resolved}</p>
        </div>
        <div className="rounded-md bg-[var(--panel-strong)] p-3">
          <p className="text-xs text-[var(--muted)]">Open</p>
          <p className="mt-1 text-xl font-semibold">{predictions.length - resolved}</p>
        </div>
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
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--muted)]">Due {prediction.dueDate}</span>
                <div className="flex gap-1">
                  <button
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onResolve(prediction.id, true)}
                    title="Resolve true"
                    type="button"
                  >
                    <Check className="size-4 text-[var(--accent)]" />
                  </button>
                  <button
                    className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                    onClick={() => onResolve(prediction.id, false)}
                    title="Resolve false"
                    type="button"
                  >
                    <CircleSlash className="size-4 text-[var(--accent-3)]" />
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
