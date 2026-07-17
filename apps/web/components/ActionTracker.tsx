import { Check, ClipboardList, CircleSlash } from "lucide-react";
import type { ActionItem } from "@/lib/types";

type ActionTrackerProps = {
  actions: ActionItem[];
  onUpdate: (id: string, status: ActionItem["status"]) => void;
};

export function ActionTracker({ actions, onUpdate }: ActionTrackerProps) {
  const open = actions.filter((action) => action.status === "open").length;

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-[var(--accent)]" />
          <h2 className="text-base font-semibold">Action Tracker</h2>
        </div>
        <span className="text-xs text-[var(--muted)]">{open} open</span>
      </div>
      <div className="max-h-[320px] space-y-3 overflow-auto pr-1 oracle-scrollbar">
        {actions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Analyze a decision to create follow-up actions.</p>
        ) : (
          actions.map((action) => (
            <article
              key={action.id}
              className={`rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 ${
                action.status !== "open" ? "opacity-65" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {action.owner} · Due {action.dueDate}
                  </p>
                </div>
                <span className="text-xs uppercase text-[var(--muted)]">{action.status}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{action.rationale}</p>
              <div className="mt-3 flex gap-1">
                <button
                  aria-label={`Mark ${action.title} done`}
                  className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                  onClick={() => onUpdate(action.id, "done")}
                  title="Mark done"
                  type="button"
                >
                  <Check className="size-4 text-[var(--accent)]" />
                </button>
                <button
                  aria-label={`Void ${action.title}`}
                  className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel)]"
                  onClick={() => onUpdate(action.id, "void")}
                  title="Void action"
                  type="button"
                >
                  <CircleSlash className="size-4 text-[var(--accent-3)]" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
