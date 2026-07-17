import { ArrowUpRight, FileText, Scale, ShieldAlert, Sparkles } from "lucide-react";
import { MetricTile } from "./MetricTile";
import { ProbabilityPanel } from "./ProbabilityPanel";
import { RiskHeatmap } from "./RiskHeatmap";
import { SimulationChart } from "./SimulationChart";
import type { DecisionAnalysis } from "@/lib/types";

export function ReportPanel({ analysis }: { analysis: DecisionAnalysis | null }) {
  if (!analysis) {
    return (
      <section className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel)] p-8 text-center">
        <div>
          <FileText className="mx-auto size-10 text-[var(--accent)]" />
          <p className="mt-4 text-lg font-semibold">No report generated</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            The workspace will populate decomposition, evidence, forecasts, simulation, risks, and calibration once a decision is analyzed.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Recommendation</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{analysis.report.recommendation}</h2>
            <span className="mt-3 inline-flex rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
              {analysis.report.recommendationLevel}
            </span>
          </div>
          <Sparkles className="mt-1 size-6 shrink-0 text-[var(--amber)]" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MetricTile label="Confidence" value={`${Math.round(analysis.report.confidenceScore * 100)}%`} />
          <MetricTile label="Evidence" value={`${Math.round(analysis.report.evidenceStrength * 100)}%`} tone="blue" />
          <MetricTile label="Success" value={`${Math.round(analysis.simulation.successProbability * 100)}%`} tone="amber" />
        </div>
        <div className="mt-4 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">What would change my mind</p>
          <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
            {analysis.report.whatWouldChangeMind.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProbabilityPanel probability={analysis.probability} />
        <SimulationChart simulation={analysis.simulation} />
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
        <div className="mb-4 flex items-center gap-2">
          <Scale className="size-4 text-[var(--accent-2)]" />
          <h2 className="text-base font-semibold">Decision Decomposition</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ListBlock title="Goal" items={[analysis.decomposition.goal]} />
          <ListBlock title="Stakeholders" items={analysis.decomposition.stakeholders} />
          <ListBlock title="Assumptions" items={analysis.decomposition.assumptions} />
          <ListBlock title="Unknowns" items={analysis.decomposition.unknowns} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
        <div className="mb-4 flex items-center gap-2">
          <ArrowUpRight className="size-4 text-[var(--accent)]" />
          <h2 className="text-base font-semibold">Forecast Scenarios</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {analysis.scenarios.map((scenario) => (
            <article key={scenario.name} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{scenario.name}</h3>
                <span className="text-sm text-[var(--muted)]">{Math.round(scenario.probability * 100)}%</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{scenario.narrative}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scenario.leadingIndicators.map((indicator) => (
                  <span key={indicator} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                    {indicator}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <RiskHeatmap risks={analysis.riskMatrix} />
        <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="size-4 text-[var(--accent-3)]" />
            <h2 className="text-base font-semibold">AI Debate</h2>
          </div>
          <div className="space-y-3">
            {analysis.debate.map((view) => (
              <article key={view.specialist} className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{view.specialist}</h3>
                  <span className="text-xs text-[var(--muted)]">{Math.round(view.confidence * 100)}%</span>
                </div>
                <p className="mt-1 text-sm font-medium text-[var(--accent)]">{view.stance}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{view.argument}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Evidence</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {analysis.researchStatus === "live"
                ? "Live citations from configured research providers."
                : "Illustrative fallback evidence. Configure Tavily or Exa for live citations."}
            </p>
          </div>
          <span className="rounded-md border border-[var(--line)] px-2 py-1 text-xs uppercase text-[var(--muted)]">
            {analysis.researchStatus}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {analysis.evidence.map((item) => (
            <a
              key={`${item.source}-${item.title}`}
              className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3 hover:border-[var(--accent)]"
              href={item.url}
              rel="noreferrer"
              target="_blank"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-xs text-[var(--muted)]">{Math.round(item.confidence * 100)}%</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {item.sourceType} · {item.direction} · {item.isReal ? "retrieved" : "illustrative"}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.summary}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{item.evidenceNote}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
        <h2 className="mb-4 text-base font-semibold">Next Steps</h2>
        <ol className="space-y-2">
          {analysis.report.nextSteps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-md bg-[var(--panel-strong)] p-3 text-sm">
              <span className="font-semibold text-[var(--accent)]">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="space-y-2 text-sm text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
