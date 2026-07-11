# Oracle Decision Intelligence MVP — Code & Security Audit

**Date:** 2026-07-11 · **Commit:** `6a7021d` (main, clean) · **Auditor:** Claude Code

**Verification run:** `npm install`, `pip install`, `npm run typecheck`, `npm run test:web` (5 passed), `npm run test:api` (2 passed), `npm run build` (success), `prisma validate` (valid). All green.

---

## 1. Executive Summary

Oracle is a well-organized, small MVP with a clean monorepo layout, consistent styling, strict TypeScript, and a deterministic analysis engine that makes local development work without API keys. The code is readable and the verification suite passes end-to-end.

The main problems are not code hygiene — they are **product integrity and readiness gaps**:

1. **The "Evidence" panel presents fabricated citations as real research.** Five hardcoded homepage links (data.gov, Statista, Google Scholar, Crunchbase, Google News) with synthetic confidence scores are rendered as clickable citations. This is the single largest credibility risk for a decision-intelligence product.
2. **The quantitative pipeline is circular.** The "Bayesian update" uses a likelihood ratio derived from the fabricated evidence scores (always > 1, so the posterior almost always rises), the Monte Carlo simulation is centered on the posterior it's supposed to independently test, and scenario probabilities don't sum to 1 (measured 0.86 on the sample decision).
3. **Persistence, auth, and billing are scaffolding only.** The Prisma schema, Clerk provider, and Stripe checkout route exist but nothing is wired: no data is saved, no user is authenticated, and the checkout route is callable by anyone unauthenticated.
4. **A corrupted `localStorage` entry permanently crashes the app** (unguarded `JSON.parse` in `page.tsx`).

None of these block local demo use. All of them block charging money for it.

---

## 2. Critical Issues

| # | Issue | Where |
|---|-------|-------|
| C1 | Fabricated evidence rendered as real citations with confidence scores | [decision_engine.py:120-147](apps/api/app/services/decision_engine.py#L120), [ReportPanel.tsx:105-124](apps/web/components/ReportPanel.tsx#L105) |
| C2 | Unguarded `JSON.parse(localStorage)` — one corrupted value bricks the page on every load | [page.tsx:26-31](apps/web/app/page.tsx#L26) |
| C3 | Stripe checkout route has no authentication or rate limiting — anyone can mint checkout sessions; no webhook exists, so a completed payment is never recorded anywhere | [route.ts:4-24](apps/web/app/api/billing/checkout/route.ts#L4) |
| C4 | `_horizon_delta` ignores the number for years: "2 years" and "3 years" → 365 days (verified). The "Major Purchase" preset uses "3 years"; its prediction due date is wrong by 2 years. "quarters"/"weeks" fall through to the 90-day default | [decision_engine.py:414-425](apps/api/app/services/decision_engine.py#L414) |
| C5 | Scenario probabilities don't sum to 1 (0.86 measured); each is independently clamped | [decision_engine.py:183-214](apps/api/app/services/decision_engine.py#L183) |

---

## 3. Security Findings by Severity

### High

- **S1 — Unauthenticated Stripe checkout endpoint** ([route.ts](apps/web/app/api/billing/checkout/route.ts)). No auth check, no rate limit, no idempotency key. In production this allows checkout-session spam against your Stripe account and there is no webhook handler to reconcile subscription state (the `Subscription` table can never be populated). Also: the un-caught `stripe.checkout.sessions.create` rejection becomes an unhandled 500 with a stack trace in logs.
- **S2 — No request-size limits on API inputs.** `DecisionRequest.constraints` caps the *list* at 12 items but each item is an unbounded string ([models.py:25](apps/api/app/models.py#L25)); `CalibrationRequest.predictions` is a fully unbounded list of unbounded statements ([models.py:126-127](apps/api/app/models.py#L126)). Uvicorn has no default body-size cap, so multi-hundred-MB payloads are parsed into memory. Add `max_length` on string items and the predictions list.

### Medium

- **S3 — No `.dockerignore`.** [apps/web/Dockerfile:11](apps/web/Dockerfile#L11) runs `COPY . .` at the repo root. If a `.env` with real keys exists at build time, it is baked into the builder layer. Add a `.dockerignore` covering `.env*`, `.git`, `node_modules`, `.venv`, `.next`.
- **S4 — Dev API binds `0.0.0.0`** ([package.json:10](package.json#L10)) — the unauthenticated API is reachable from the LAN during development. Use `127.0.0.1` for `dev:api` (the README's manual command already does).
- **S5 — Prompt injection into the AI overlay.** [ai_clients.py:51-58](apps/api/app/services/ai_clients.py#L51) serializes user-controlled decision text straight into the model input, and the returned `recommendation` string replaces the report's recommendation verbatim ([main.py:39-45](apps/api/app/main.py#L39)). The strict JSON schema constrains *shape*, not *content* — a user (or a shared preset) can steer the recommendation arbitrarily. Acceptable for single-user MVP; a real problem once analyses are shared or persisted.
- **S6 — CORS is dev-only.** Origins are hardcoded to localhost ([main.py:16-26](apps/api/app/main.py#L16)); `allow_credentials=True` with `allow_methods/headers=["*"]` is broader than needed (the API uses no credentials). Move origins to an env var before deploying.

### Low

- **S7 — npm audit: 2 moderate** — `next@16.2.10` bundles `postcss <8.5.10` (XSS in stringify output, GHSA-qx2v-qp2m-jg93). Your root `overrides` pins `postcss@8.5.16` for the top-level tree but the advisory hits Next's vendored copy; upgrade Next when a patched 16.x lands.
- **S8 — CI actions referenced by tag, not SHA** ([ci.yml:26-33](.github/workflows/ci.yml#L26)); `npm install` instead of `npm ci` means CI doesn't actually enforce the lockfile; Python deps are unpinned ranges with no lockfile (CI 3.13 vs local 3.14 already diverge).
- **S9 — AI overlay swallows all exceptions silently** ([ai_clients.py:88-89](apps/api/app/services/ai_clients.py#L88)) — `except Exception: return None` with no logging. Misconfiguration, quota exhaustion, and real bugs are indistinguishable from "disabled."

### Not currently exploitable (flag for later)

- Postgres credentials `oracle:oracle` in docker-compose/CI — fine for local/CI, never reuse in production.
- Clerk is mounted but nothing is protected; when auth arrives, every API route and the checkout route must check the session server-side (middleware), not rely on the client provider.

---

## 4. Backend Findings

### Route design ([main.py](apps/api/app/main.py))

- Two endpoints, clean Pydantic request/response models, correct `response_model` usage, alias-based camelCase output. Good.
- `analyze_decision` is `async` but `build_analysis` is pure CPU — fine at this scale (5,000 iterations is sub-millisecond), but if iterations grow, move to a threadpool.
- No exception handlers, no logging, no request IDs, no `/health` details (version, AI-enabled flag). Minimal but acceptable for MVP.
- The overlay merge trusts `overlay.get("nextSteps")` to be a list of strings — the strict schema guarantees it today, but the boundary deserves a Pydantic model (`OverlayResponse`) instead of a raw `dict`.

### Pydantic models ([models.py](apps/api/app/models.py))

- Good use of `Literal` domains, `ge/le` bounds, and aliases. Gaps: unbounded string items (S2), and `PredictionResult.statement` accepts empty strings.
- `SimulationSummary.samples` is documented nowhere as "40 sorted quantile points" — the name implies raw draws. Rename to `distribution` or document it.

### Deterministic engine quality ([decision_engine.py](apps/api/app/services/decision_engine.py))

This is honest scaffolding (the `ai_clients` docstring says the deterministic engine is the local source of truth), but several things are methodologically wrong rather than merely synthetic:

- **Circular Bayes (major).** `likelihood_ratio = clamp(0.75 + evidence_strength, 0.6, 1.75)` where `evidence_strength` averages the *fabricated* confidence scores (≈0.68-0.72 always). So LR ≈ 1.45 in essentially every run: the "update" almost always moves the posterior up, regardless of the decision. A likelihood ratio must encode how much more likely the evidence is under success than failure; a constant > 1 is a thumb on the scale.
- **Circular simulation (major).** `center = 50 + (posterior - 0.5) * 70`, then `successProbability = P(sample > 50)`. The simulation's headline output is a noisy re-statement of the posterior it was fed (measured: posterior 0.46 → sim success 0.46). The dashboard shows these as two independent metrics ("Success" tile + "Posterior" bar), which overstates the evidence.
- **Scenario probabilities don't normalize** (C5). Sum ranges roughly 0.61-1.48 across the clamp space; renormalize after clamping.
- **Same seed, same stream.** `run_simulation` re-instantiates `random.Random(seed)` after `build_evidence` consumed draws from an identical stream ([decision_engine.py:44](apps/api/app/services/decision_engine.py#L44), [217-218](apps/api/app/services/decision_engine.py#L217)) — the first 5 simulation shocks are correlated with the evidence noise. Harmless now; derive per-stage seeds (`seed+1`, `seed+2`) to be safe.
- `_percentile` uses truncating nearest-rank ([decision_engine.py:409-411](apps/api/app/services/decision_engine.py#L409)) — biased low; use `statistics.quantiles` or linear interpolation.
- `_horizon_delta` bugs (C4). Also `"month" in lowered` collects *all* digits: "1 month 15 days" → 115 months.
- `analysis.id` is date-stable ([decision_engine.py:60](apps/api/app/services/decision_engine.py#L60)) — same decision analyzed twice on one day gets the same id. The journal works around it by appending `Date.now()`; make the id itself unique (uuid4) once persistence exists.

### Calibration / Brier logic

- The mean Brier score is computed correctly in both [decision_engine.py:361-382](apps/api/app/services/decision_engine.py#L361) and [calibration.ts](apps/web/lib/calibration.ts), with matching interpretation thresholds — but the thresholds/labels are **duplicated across languages** and will drift. Pick one owner (the API) or generate both from a shared spec.
- Note: the `/api/predictions/score` endpoint is **dead code** — the frontend computes Brier locally and never calls it.
- Brier alone is a weak calibration story: it conflates calibration and resolution. See roadmap (§7) for decomposition and reliability curves.

### AI overlay design ([ai_clients.py](apps/api/app/services/ai_clients.py))

- Good instincts: opt-in flag, strict JSON schema, numbers explicitly out of scope for the model, deterministic fallback.
- Gaps: no timeout (a hung OpenAI call hangs the request), silent `except Exception` (S9), no Anthropic client despite `ANTHROPIC_API_KEY`/`anthropic` dependency being declared (dead config + dead dependency), model name from env unvalidated.

### Persistence plan ([schema.prisma](prisma/schema.prisma))

The schema is thoughtful and mostly production-shaped, but currently **entirely unused** — no code imports `@prisma/client`, and there are no migrations. Schema-level notes for when it's wired:

- **Missing FK indexes.** Postgres does not auto-index foreign keys: `EvidenceCitation.decisionId`, `Scenario.decisionId`, `Risk.decisionId`, `SimulationRun.decisionId`, `Prediction.decisionId`, `Subscription.userId` all need `@@index`.
- `Decision.status`, `Subscription.status`, `Subscription.plan` are free-form `String`s — make them enums.
- `Decision` stores the recommendation but not the posterior/prior/LR or the report's next steps — you can't reconstruct an analysis from the DB. Either store the full analysis JSON (`Json` column) or add the missing scalars.
- `Prediction.outcome` as `PENDING/TRUE/FALSE` + separate `resolvedAt` is fine; consider a `CANCELLED/VOID` state for unresolvable predictions (standard in forecasting platforms).
- Scenario/Risk lack `createdAt`; harmless but inconsistent with siblings.

---

## 5. Frontend Findings

### Correctness & state

- **F1 (critical, = C2):** unguarded `JSON.parse` of `oracle.predictionJournal` — wrap in try/catch, validate shape, and clear the key on failure.
- **F2:** "Save Prediction" has no dedup or feedback — repeated clicks silently create identical journal entries ([page.tsx:62-73](apps/web/app/page.tsx#L62)).
- **F3:** [api.ts:14-16](apps/web/lib/api.ts#L14) discards the response body, so FastAPI 422 validation detail ("decision must be ≥ 20 chars") reaches the user as "Oracle API returned 422". There is also **no client-side validation** mirroring the API's min-lengths, so short input = cryptic failure. No timeout/AbortController either — a hung API leaves the button in "Analyzing" forever.
- **F4:** `response.json() as Promise<DecisionAnalysis>` is an unchecked cast, and [types.ts](apps/web/lib/types.ts) hand-mirrors the Pydantic models — silent drift risk. Add zod parsing at the boundary (also fixes F3's error surfacing) or generate types from FastAPI's OpenAPI schema.
- **F5:** resolving a prediction is irreversible in the UI (no un-resolve, no delete, no edit) — a misclick permanently pollutes the Brier score.
- State management itself is appropriately simple (lifted state + localStorage); no need for a store at this size.

### UX flow & dashboard

- The 6-step timeline (Clarify → Calibrate) is a nice mental model, but the steps aren't interactive and "Research"/"Forecast" flip to complete simultaneously — consider making steps anchor-scroll to their panel.
- The dashboard reads well top-to-bottom (recommendation → probability → simulation → decomposition → scenarios → risks/debate → evidence → next steps).
- **The Monte Carlo chart is misleading**: samples arrive pre-sorted, so the bar chart is always a smooth ascending ramp regardless of the distribution ([SimulationChart.tsx:15-24](apps/web/components/SimulationChart.tsx#L15)). Render a histogram (bin the values) or an explicit CDF with labeled axes; mark P10/P50/P90 on the chart.
- Preset selector works (self-resetting `<select>` is a bit hacky but fine); loading a preset while the form has user edits silently overwrites them — confirm or offer undo.
- Loading state is button-text-only; the report area gives no signal that work is happening. Empty state is good. Error state is exiled to the sidebar, far from the button the user clicked.

### Risk heatmap

- Hardcoded hex colors ([RiskHeatmap.tsx:3-9](apps/web/components/RiskHeatmap.tsx#L3)) ignore the theme variables — check contrast in light mode.
- Cell meaning is color-only + hover title; risks in cells aren't identified (just a count). Colorblind users get nothing. Add labels/patterns and put risk initials in the cells.

### Accessibility

- Icon-only buttons rely on `title` — add `aria-label` (theme toggle, reset, resolve true/false).
- Heatmap cells are unreadable to screen readers (`div`s with `title`).
- Progress bars in ProbabilityPanel are plain `div`s — add `role="progressbar"` + `aria-valuenow`.
- Theme defaults to dark, ignores `prefers-color-scheme`, and isn't persisted across reloads.
- Focus styles exist via `focus:border-[var(--accent)]` on inputs — good; buttons lack visible focus rings.

### Responsiveness

- Grid breakpoints (`lg:grid-cols`, `xl:grid-cols`) are sensible. On mobile the full sidebar (timeline + prediction card) pushes the form below the fold — consider collapsing the timeline on small screens. The 5-column heatmap and 4-stat row will get tight at 320px but remain usable.

---

## 6. Testing Gaps

Current coverage: 2 pytest tests (one happy-path smoke, one Brier), 2 vitest files (presets shape, calibration math). Everything else is untested.

Priority order:

1. **API endpoint tests** with `fastapi.testclient.TestClient` — status codes, 422 on short input, response schema, calibration edge cases (empty list, prob 0/1). `httpx` is already a dependency.
2. **`_horizon_delta` unit tests** — would have caught C4 immediately.
3. **Engine property tests** — scenario probabilities sum to 1 (fails today, C5), posterior within clamps, determinism (same input → same output), monotonicity (Aggressive ≥ Conservative prior).
4. **`api.ts`/journal logic tests** — error paths, localStorage corruption (fails today, C2), save/resolve flows.
5. **Component smoke tests** (testing-library) for DecisionForm validation and ReportPanel empty state.
6. **AI overlay test** with a mocked OpenAI client — the merge path in `main.py` is untested.
7. Later: one Playwright e2e (analyze sample decision → save prediction → resolve → Brier appears); the `.playwright-cli` artifacts suggest manual browser testing already happens — automate it.
8. CI: add `ruff` (Python) and ESLint (none configured at all), switch `npm install` → `npm ci`, add a pip lockfile (`uv` or `pip-tools`), align Python to one version.

---

## 7. Recommended Feature Roadmap (Intelligence / Product)

### Research engine & real citations (the differentiator)

- Wire **Tavily/Exa** (keys already scaffolded in `.env.example`) into a real research step: query generation from the decomposition's unknowns → search → per-source scoring (recency, authority, independence, relevance) → citations with real URLs, quoted snippets, and retrieval dates. Replace the fabricated evidence panel (C1) — until then, label the panel "Illustrative sources" honestly.
- Derive the likelihood ratio from evidence *direction*, not just confidence: classify each source as supporting/contradicting/neutral toward the success metric, and compose per-source LRs (log-odds sum) so the Bayesian update becomes real.
- **Source triangulation score**: penalize evidence sets where all sources share a root (same publisher/press release).

### Forecast calibration upgrades

- Brier **decomposition** (calibration/resolution/uncertainty) and a **reliability curve** (predicted vs. observed frequency in bins) once ≥ ~20 resolved predictions exist.
- Per-domain calibration ("you're overconfident on Startup decisions, well-calibrated on Purchases").
- **Reference-class prompts**: before saving a prediction, show base-rate anchors ("similar 6-month startup launches: ~35-45%") — even a static lookup table beats nothing.
- Log-loss alongside Brier; time-weighted scores so early predictions with long horizons aren't unfairly compared.

### Prediction journal improvements

- Edit/delete/void predictions (F5); resolution notes ("why did this resolve false?"); overdue-prediction surfacing (due date passed, unresolved); probability re-forecasting over time (store a probability *history* per prediction — this is how you compute a personal "update quality" metric, and the Prisma schema should model it).
- Export (CSV/JSON) for users who live in spreadsheets.

### Monte Carlo improvements

- Simulate from **scenario mixture** instead of a single triangular around the posterior: sample scenario ~ categorical(probabilities), then payoff ~ distribution per scenario. This breaks the circularity (major methodological fix) and makes the scenarios load-bearing rather than decorative.
- Let users set payoff ranges per scenario (the current ±utility units are opaque — dollar-denominated payoffs when a budget is given).
- Report **P(loss)**, expected shortfall (CVaR), and break-even probability, not just P10/50/90.
- Sensitivity/tornado analysis: which input assumption moves EV most.

### Scenario comparison & decision history

- **Compare mode**: run 2-3 variants of a decision (different budgets/horizons) side-by-side with EV/risk deltas. This is the natural "pro" feature.
- Wire the Prisma schema: persist decisions + analyses, list past decisions, re-run and diff against the previous analysis ("what changed since last month").
- Saved reports: shareable read-only report URL (requires auth + persistence first), PDF export later.

### AI overlay / agent debate

- The debate panel is currently static text with fake confidence numbers. Make it real with one cheap LLM call per specialist persona (or one call returning all seven), grounded in the actual decomposition and evidence — and let personas *disagree numerically* (each gives a probability; show the spread as an honest uncertainty signal).
- Add an **adversarial pass**: a "red team" persona whose only job is to find the strongest argument against the recommendation. Structured output, temperature 0.3-0.5.
- Provider strategy: you already declare both SDKs; route by task — cheap/fast model for decomposition and debate personas, stronger model for the final recommendation synthesis. Keep the deterministic engine as the always-available fallback and as the *numeric* source of truth (the current "AI improves words, not numbers" split is a genuinely good design — keep it).

### Knowledge graph (later)

- Persist decomposition entities (assumptions, risks, stakeholders) as first-class rows; link recurring assumptions across decisions ("you've assumed 'demand can be piloted' 6 times; it resolved false twice"). That cross-decision assumption ledger is a real moat and nobody in the space does it well.

### Onboarding / presets / dashboard

- Presets are good. Add: a "blank + guided" mode that asks the decomposition questions one at a time; preset preview on hover; user-saved custom presets (localStorage first, DB later).
- Dashboard: make the recommendation card state explicit (Proceed / Evidence sprint / Don't commit as a colored badge); surface "what would change my mind" — the top sensitivity driver — right under the recommendation.

---

## 8. Quick Wins (hours each)

1. Guard the localStorage read (C2) — try/catch + shape check.
2. Fix `_horizon_delta` (C4) — parse the number for years; handle weeks/quarters; add tests.
3. Normalize scenario probabilities (C5) — divide by the sum after clamping.
4. Surface API error detail in `api.ts` (F3) + mirror min-length validation in the form.
5. Add `max_length` to string items and the predictions list (S2).
6. Add `.dockerignore` (S3); bind dev API to 127.0.0.1 (S4).
7. Add logging to the AI overlay except-path (S9) and a 15s timeout on the OpenAI call.
8. Sort the Monte Carlo chart into histogram bins instead of a sorted ramp.
9. `aria-label`s on icon buttons; persist + system-default theme.
10. CI: `npm ci`, pin actions by SHA, add ruff + eslint.
11. Delete or wire the dead `/api/predictions/score` endpoint (frontend duplicates it).
12. Return 503-with-message instead of unhandled 500 when Stripe call fails (wrap in try/catch).

## 9. Larger Architectural Improvements

1. **Real research pipeline** (Tavily/Exa → scored citations → directional LRs). Replaces C1 and makes the Bayesian layer honest. This is the product.
2. **Scenario-mixture Monte Carlo** — de-circularizes the simulation and makes scenarios load-bearing.
3. **Wire persistence**: Prisma client in the web app (or move DB access behind FastAPI), migrations, decision history. Prereq for auth, sharing, and calibration analytics.
4. **Auth end-to-end**: Clerk middleware protecting API routes + a verified-user check in the checkout route + Stripe webhook handler writing `Subscription` rows (fixes S1/C3 properly).
5. **Typed API boundary**: generate TS types from FastAPI's OpenAPI (or zod schemas) to kill the hand-mirrored `types.ts`.
6. **Observability**: structured logging + request IDs in FastAPI, Sentry (or similar) on both sides, before any paid launch.

## 10. Prioritized Action Plan

### P0 — before showing to any external user
- C2 localStorage crash guard
- C1 label the evidence panel as illustrative (one-line change) until real research lands
- C4 horizon parsing fix (+ tests)
- C5 scenario normalization
- S2 input size caps
- F3 error detail surfacing + client-side validation

### P1 — before charging money
- S1/C3 Stripe: auth on checkout, webhook handler, error handling
- Real research engine (§9.1) and de-circularized simulation (§9.2)
- Persistence + Clerk middleware (§9.3, §9.4)
- API endpoint tests + engine property tests + CI hardening (npm ci, lint, pinned actions)
- S3 `.dockerignore`, S6 env-driven CORS, S9 overlay logging/timeout
- Prisma FK indexes + status enums

### P2 — growth
- Scenario comparison, decision history diffing, saved/shared reports
- Brier decomposition + reliability curves + per-domain calibration
- Real multi-persona debate with numeric disagreement + red-team pass
- Assumption ledger / knowledge graph
- Typed API boundary generation, e2e Playwright suite, observability stack
- Team features (shared journals, org calibration leaderboards)

---

*No code was modified in this audit. All findings verified against commit `6a7021d`; behavioral claims (horizon parsing, scenario sums, simulation circularity) were confirmed by executing the engine directly.*
