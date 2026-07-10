"use client";

import { Brain, RefreshCw, Send } from "lucide-react";
import type { DecisionDomain, DecisionRequest, RiskTolerance } from "@/lib/types";

const domains: DecisionDomain[] = [
  "Business",
  "Investment",
  "Career",
  "Purchase",
  "Strategy",
  "Startup",
  "Personal"
];

const riskLevels: RiskTolerance[] = ["Conservative", "Balanced", "Aggressive"];

type DecisionFormProps = {
  value: DecisionRequest;
  isLoading: boolean;
  onChange: (value: DecisionRequest) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function DecisionForm({ value, isLoading, onChange, onSubmit, onReset }: DecisionFormProps) {
  const setField = <Key extends keyof DecisionRequest>(key: Key, next: DecisionRequest[Key]) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-[var(--accent)]" />
          <h1 className="text-lg font-semibold">Decision Workspace</h1>
        </div>
        <button
          className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel-strong)]"
          onClick={onReset}
          title="Reset workspace"
          type="button"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--muted)]">Decision title</span>
          <input
            className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            value={value.title}
            onChange={(event) => setField("title", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--muted)]">Domain</span>
          <select
            className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            value={value.domain}
            onChange={(event) => setField("domain", event.target.value as DecisionDomain)}
          >
            {domains.map((domain) => (
              <option key={domain}>{domain}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Decision</span>
        <textarea
          className="min-h-36 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-3 outline-none focus:border-[var(--accent)]"
          value={value.decision}
          onChange={(event) => setField("decision", event.target.value)}
        />
      </label>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--muted)]">Time horizon</span>
          <input
            className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            value={value.time_horizon}
            onChange={(event) => setField("time_horizon", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--muted)]">Budget</span>
          <input
            className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            value={value.budget ?? ""}
            onChange={(event) => setField("budget", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--muted)]">Risk tolerance</span>
          <select
            className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            value={value.risk_tolerance}
            onChange={(event) => setField("risk_tolerance", event.target.value as RiskTolerance)}
          >
            {riskLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Constraints</span>
        <input
          className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
          value={value.constraints.join("; ")}
          onChange={(event) =>
            setField(
              "constraints",
              event.target.value
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean)
            )
          }
        />
      </label>

      <label className="mt-3 block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Success metric</span>
        <input
          className="w-full rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-[var(--accent)]"
          value={value.success_metric}
          onChange={(event) => setField("success_metric", event.target.value)}
        />
      </label>

      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={onSubmit}
        type="button"
      >
        <Send className="size-4" />
        {isLoading ? "Analyzing" : "Analyze Decision"}
      </button>
    </section>
  );
}
