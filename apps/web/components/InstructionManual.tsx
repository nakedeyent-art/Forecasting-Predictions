import { BookOpen, ListChecks, SearchCheck } from "lucide-react";
import { glossaryTerms, manualSections } from "@/lib/manual";

export function InstructionManual() {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 size-5 shrink-0 text-[var(--accent-2)]" />
          <div>
            <h2 className="text-lg font-semibold">Instruction Manual</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Use this reference while preparing topics, reading reports, and tracking predictions.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {manualSections.map((section, index) => (
          <details
            key={section.id}
            className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3"
            open={index === 0}
          >
            <summary className="cursor-pointer list-none">
              <span className="flex items-start gap-2">
                <ListChecks className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                <span>
                  <span className="block text-sm font-semibold">{section.title}</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">{section.summary}</span>
                </span>
              </span>
            </summary>
            <ol className="mt-3 space-y-3">
              {section.steps.map((step, stepIndex) => (
                <li key={step.title} className="grid grid-cols-[1.5rem_1fr] gap-3 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--line)] text-xs font-semibold text-[var(--muted)]">
                    {stepIndex + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{step.title}</span>
                    <span className="mt-1 block text-[var(--muted)]">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </details>
        ))}

        <details className="rounded-md border border-[var(--line)] bg-[var(--panel-strong)] p-3">
          <summary className="cursor-pointer list-none">
            <span className="flex items-start gap-2">
              <SearchCheck className="mt-0.5 size-4 shrink-0 text-[var(--amber)]" />
              <span>
                <span className="block text-sm font-semibold">Glossary</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  Definitions for the decision intelligence terms used in Oracle.
                </span>
              </span>
            </span>
          </summary>
          <dl className="mt-3 grid gap-3">
            {glossaryTerms.map((item) => (
              <div key={item.term} className="rounded-md border border-[var(--line)] p-3">
                <dt className="text-sm font-semibold">{item.term}</dt>
                <dd className="mt-1 text-sm text-[var(--muted)]">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
    </section>
  );
}
