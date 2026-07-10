"use client";

import { useEffect, useMemo, useState } from "react";
import { Moon, Save, Sun } from "lucide-react";
import { DecisionForm } from "@/components/DecisionForm";
import { PredictionJournal } from "@/components/PredictionJournal";
import { ReportPanel } from "@/components/ReportPanel";
import { analyzeDecision } from "@/lib/api";
import { sampleDecision } from "@/lib/sample";
import type { DecisionAnalysis, DecisionRequest, JournalPrediction } from "@/lib/types";

const storageKey = "oracle.predictionJournal";

export default function Home() {
  const [decision, setDecision] = useState<DecisionRequest>(sampleDecision);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [predictions, setPredictions] = useState<JournalPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      setPredictions(JSON.parse(raw) as JournalPrediction[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(predictions));
  }, [predictions]);

  const timeline = useMemo(
    () => [
      ["Clarify", Boolean(decision.title && decision.decision)],
      ["Decompose", Boolean(analysis?.decomposition)],
      ["Research", Boolean(analysis?.evidence.length)],
      ["Forecast", Boolean(analysis?.scenarios.length)],
      ["Simulate", Boolean(analysis?.simulation)],
      ["Calibrate", predictions.some((prediction) => typeof prediction.outcome === "boolean")]
    ],
    [analysis, decision.decision, decision.title, predictions]
  );

  async function runAnalysis() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeDecision(decision);
      setAnalysis(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Oracle API request failed");
    } finally {
      setIsLoading(false);
    }
  }

  function savePrediction() {
    if (!analysis) {
      return;
    }
    const prediction: JournalPrediction = {
      ...analysis.prediction,
      id: `${analysis.id}-${Date.now()}`,
      title: decision.title,
      createdAt: new Date().toISOString()
    };
    setPredictions((current) => [prediction, ...current]);
  }

  function resolvePrediction(id: string, outcome: boolean) {
    setPredictions((current) =>
      current.map((prediction) => (prediction.id === id ? { ...prediction, outcome } : prediction))
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--line)] bg-[var(--panel)] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold">Oracle</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Decision intelligence</p>
            </div>
            <button
              className="rounded-md border border-[var(--line)] p-2 hover:bg-[var(--panel-strong)]"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              title="Toggle theme"
              type="button"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>

          <div className="mt-8 space-y-2">
            {timeline.map(([label, complete], index) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                    complete ? "bg-[var(--accent)] text-white" : "bg-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Prediction</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--accent)]">
              {analysis ? `${Math.round(analysis.prediction.probability * 100)}%` : "--"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {analysis ? analysis.prediction.statement : "Awaiting decision analysis."}
            </p>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold hover:bg-[var(--panel)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!analysis}
              onClick={savePrediction}
              title="Save prediction"
              type="button"
            >
              <Save className="size-4" />
              Save Prediction
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-[var(--accent-3)] bg-[var(--panel-strong)] p-3 text-sm text-[var(--accent-3)]">
              {error}
            </div>
          ) : null}
        </aside>

        <section className="p-4 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(360px,460px)_1fr]">
            <div className="space-y-5">
              <DecisionForm
                value={decision}
                isLoading={isLoading}
                onChange={setDecision}
                onSubmit={runAnalysis}
                onReset={() => {
                  setDecision(sampleDecision);
                  setAnalysis(null);
                  setError(null);
                }}
              />
              <PredictionJournal predictions={predictions} onResolve={resolvePrediction} />
            </div>
            <ReportPanel analysis={analysis} />
          </div>
        </section>
      </div>
    </main>
  );
}
