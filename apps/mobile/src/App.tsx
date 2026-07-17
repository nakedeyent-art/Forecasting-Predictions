import { useEffect, useMemo, useState } from "react";
import { Moon, Save, Sun } from "lucide-react";
import { ActionTracker } from "@/components/ActionTracker";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { DecisionHistory } from "@/components/DecisionHistory";
import { DecisionForm } from "@/components/DecisionForm";
import { InstructionManual } from "@/components/InstructionManual";
import { PredictionJournal } from "@/components/PredictionJournal";
import { ReportPanel } from "@/components/ReportPanel";
import { sampleDecision } from "@/lib/sample";
import {
  isActionItem,
  isJournalPrediction,
  isSavedDecision,
  isUserPreset,
  readStoredArray,
  storageKeys,
  writeStoredArray
} from "@/lib/storage";
import type { ActionItem, DecisionAnalysis, DecisionRequest, JournalPrediction, SavedDecision, UserPreset } from "@/lib/types";
import { validateDecisionRequest } from "@/lib/validation";
import { analyzeDecision } from "./api";

export function App() {
  const [decision, setDecision] = useState<DecisionRequest>(sampleDecision);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [predictions, setPredictions] = useState<JournalPrediction[]>([]);
  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [customPresets, setCustomPresets] = useState<UserPreset[]>([]);
  const [comparisonBaseline, setComparisonBaseline] = useState<SavedDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("oracle.theme", theme);
  }, [theme]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("oracle.theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
    }
    setPredictions(readStoredArray(window.localStorage, storageKeys.predictions, isJournalPrediction));
    setSavedDecisions(readStoredArray(window.localStorage, storageKeys.decisions, isSavedDecision));
    setActions(readStoredArray(window.localStorage, storageKeys.actions, isActionItem));
    setCustomPresets(readStoredArray(window.localStorage, storageKeys.presets, isUserPreset));
  }, []);

  useEffect(() => {
    writeStoredArray(window.localStorage, storageKeys.predictions, predictions);
  }, [predictions]);

  useEffect(() => {
    writeStoredArray(window.localStorage, storageKeys.decisions, savedDecisions);
  }, [savedDecisions]);

  useEffect(() => {
    writeStoredArray(window.localStorage, storageKeys.actions, actions);
  }, [actions]);

  useEffect(() => {
    writeStoredArray(window.localStorage, storageKeys.presets, customPresets);
  }, [customPresets]);

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
    const validationErrors = validateDecisionRequest(decision);
    if (validationErrors.length) {
      setError(validationErrors.join(" "));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeDecision(decision);
      setAnalysis(result);
      setComparisonBaseline(savedDecisions[0] ?? null);
      const savedDecision: SavedDecision = {
        id: result.id,
        title: decision.title,
        createdAt: result.generatedAt,
        request: decision,
        analysis: result
      };
      setSavedDecisions((current) => [savedDecision, ...current.filter((item) => item.id !== savedDecision.id)].slice(0, 50));
      setActions((current) => [...result.actions, ...current].slice(0, 100));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Oracle API request failed");
    } finally {
      setIsLoading(false);
    }
  }

  function updateDecision(nextDecision: DecisionRequest) {
    setDecision(nextDecision);
    setAnalysis(null);
    setError(null);
  }

  function savePrediction() {
    if (!analysis) {
      return;
    }
    const prediction: JournalPrediction = {
      ...analysis.prediction,
      id: `${analysis.id}-${Date.now()}`,
      title: decision.title,
      createdAt: new Date().toISOString(),
      status: "open"
    };
    setPredictions((current) => {
      if (current.some((item) => item.statement === prediction.statement && item.status !== "void")) {
        return current;
      }
      return [prediction, ...current];
    });
  }

  function resolvePrediction(id: string, outcome: boolean) {
    setPredictions((current) =>
      current.map((prediction) =>
        prediction.id === id
          ? { ...prediction, outcome, status: "resolved", resolvedAt: new Date().toISOString() }
          : prediction
      )
    );
  }

  function voidPrediction(id: string) {
    setPredictions((current) =>
      current.map((prediction) => (prediction.id === id ? { ...prediction, status: "void", outcome: null } : prediction))
    );
  }

  function reopenPrediction(id: string) {
    setPredictions((current) =>
      current.map((prediction) =>
        prediction.id === id
          ? { ...prediction, status: "open", outcome: null, resolvedAt: undefined, resolutionNote: undefined }
          : prediction
      )
    );
  }

  function deletePrediction(id: string) {
    setPredictions((current) => current.filter((prediction) => prediction.id !== id));
  }

  function saveCustomPreset() {
    const preset: UserPreset = {
      id: `preset-${Date.now()}`,
      label: decision.title || "Custom preset",
      createdAt: new Date().toISOString(),
      request: decision
    };
    setCustomPresets((current) => [preset, ...current.filter((item) => item.label !== preset.label)].slice(0, 20));
  }

  function loadSavedDecision(savedDecision: SavedDecision) {
    setDecision(savedDecision.request);
    setAnalysis(savedDecision.analysis);
    setComparisonBaseline(savedDecisions.find((item) => item.id !== savedDecision.id) ?? null);
    setError(null);
  }

  function updateAction(id: string, status: ActionItem["status"]) {
    setActions((current) => current.map((action) => (action.id === id ? { ...action, status } : action)));
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--line)] bg-[var(--panel)] p-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold">Oracle</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Decision intelligence</p>
            </div>
            <button
              aria-label="Toggle theme"
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

        <section className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(360px,460px)_1fr]">
            <div className="space-y-5">
              <DecisionForm
                value={decision}
                isLoading={isLoading}
                onChange={updateDecision}
                onSubmit={runAnalysis}
                customPresets={customPresets}
                onSavePreset={saveCustomPreset}
                onReset={() => {
                  setDecision(sampleDecision);
                  setAnalysis(null);
                  setError(null);
                }}
              />
              <InstructionManual />
              <DecisionHistory
                decisions={savedDecisions}
                onDelete={(id) => setSavedDecisions((current) => current.filter((item) => item.id !== id))}
                onLoad={loadSavedDecision}
              />
              <ActionTracker actions={actions} onUpdate={updateAction} />
              <PredictionJournal
                predictions={predictions}
                onDelete={deletePrediction}
                onReopen={reopenPrediction}
                onResolve={resolvePrediction}
                onVoid={voidPrediction}
              />
            </div>
            <div className="space-y-4">
              <ComparisonPanel current={analysis} previous={comparisonBaseline} />
              <ReportPanel analysis={analysis} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
