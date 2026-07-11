# Oracle — Implementation Handoff

You are implementing the fixes and improvements from a completed audit (see `AUDIT.md` in this repo for full findings and rationale). This document is self-contained: everything you need to act is here.

## Context

- **Repo root:** `/Users/rizzolini/Documents/ForecastingPredictions` (git, branch `main`)
- **App:** Oracle, a standalone decision-intelligence MVP. Web on `localhost:3000`, API on `localhost:8001`. Port `8000` may be occupied by an unrelated app — never use it.
- **Stack:** Next.js 16 + React 19 + TypeScript + Tailwind (`apps/web`), FastAPI + Pydantic (`apps/api`), Prisma/PostgreSQL schema (`prisma/`, currently unwired), optional Clerk/Stripe/OpenAI/Anthropic/Tavily/Exa integrations.
- **Design principle to preserve:** the deterministic engine owns all numbers; AI may only improve wording. Local dev must keep working with zero API keys.

## Setup & verification

```bash
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r apps/api/requirements.txt
```

Run after EVERY phase (all must stay green):

```bash
npm run typecheck
npm run test:web
source .venv/bin/activate && npm run test:api
npm run build
DATABASE_URL="postgresql://oracle:oracle@localhost:5432/oracle" npm run prisma:validate
```

## Working rules

1. Work phase by phase, in order. **One small commit per numbered task**, message format: `fix: <what> (audit C2)` / `feat: <what> (audit P1-3)`.
2. Do not refactor beyond the task at hand. Match existing code style (no comment noise, camelCase API aliases, CSS variables for theming).
3. Every behavioral fix gets a test that would have caught the bug.
4. Never invent API keys or call paid services in tests. Anything needing real credentials (Stripe webhook secret, Clerk keys, Tavily/Exa keys) must degrade gracefully when unset, exactly like the existing `USE_AI_ANALYSIS` pattern.
5. If a task turns out to conflict with something you discover in the code, stop and flag it in your summary instead of improvising a redesign.
6. Stop at the end of each phase checkpoint and report before continuing.

---

## PHASE 1 — Critical fixes & quick wins (P0)

### 1.1 Guard localStorage read (audit C2)
`apps/web/app/page.tsx:26-31` — `JSON.parse` of `oracle.predictionJournal` is unguarded; a corrupted value crashes the page on every load. Wrap in try/catch, validate it's an array of objects with `id`, `statement`, `probability`, `dueDate` (drop invalid entries), and remove the key on parse failure. Add a vitest for the validation helper (extract it to `apps/web/lib/journal.ts` so it's testable).

### 1.2 Fix `_horizon_delta` (audit C4)
`apps/api/app/services/decision_engine.py:414-425` — verified bugs: `"2 years"`/`"3 years"` → 365 days (year branch ignores digits); `"quarters"` and `"weeks"` fall through to 90-day default; `"1 month 15 days"` concatenates all digits → 115 months. Rewrite to extract the leading number per unit and support days/weeks/months/quarters/years (weeks=7d, quarters=91d, months=30d, years=365d, default 90d). Add pytest cases for all of these including the verified failures.

### 1.3 Normalize scenario probabilities (audit C5)
`decision_engine.py:183-214` — after clamping, the four scenario probabilities sum to ~0.86 (verified), not 1. Renormalize (divide each by the sum, round to 2dp; adjust the largest so the rounded values sum to exactly 1.0). Add a pytest property test: probabilities sum to 1.0 for several representative requests.

### 1.4 Surface API error detail + client validation (audit F3)
- `apps/web/lib/api.ts` — on `!response.ok`, read the JSON body and include FastAPI's `detail` in the thrown Error message (fall back to status text). Add an `AbortController` timeout (30s).
- `apps/web/components/DecisionForm.tsx` — disable submit and show inline hints until: title ≥ 3 chars, decision ≥ 20 chars (mirror `apps/api/app/models.py:22-24`).

### 1.5 Input size caps on API (audit S2)
`apps/api/app/models.py` — constrain string items, not just list lengths: `constraints: list[str]` items max 200 chars; `CalibrationRequest.predictions` max 500 items; `PredictionResult.statement` 1–500 chars. Use `Annotated[str, StringConstraints(...)]` or field validators. Add pytest cases (oversized item → 422 via TestClient).

### 1.6 Label evidence as illustrative (audit C1 interim)
`apps/web/components/ReportPanel.tsx:105-124` — the evidence panel renders hardcoded fabricated citations. Until Phase 4 replaces them, change the heading to "Evidence (illustrative)" and add a one-line muted caption: "Placeholder sources — connect a research provider for live citations."

### 1.7 Docker & dev-server hygiene (audit S3, S4)
- Create root `.dockerignore`: `.env*`, `.git`, `node_modules`, `.venv`, `.next`, `__pycache__`, `.pytest_cache`, `*.tsbuildinfo`, `.playwright-cli`, `.codex`.
- `package.json` `dev:api` script: change `--host 0.0.0.0` → `--host 127.0.0.1`.

### 1.8 AI overlay logging + timeout (audit S9)
`apps/api/app/services/ai_clients.py` — replace silent `except Exception: return None` with `logging.getLogger(__name__).warning("AI overlay failed", exc_info=True)` then return None. Pass `timeout=15.0` to the OpenAI client. Keep behavior otherwise identical.

### 1.9 Stripe route error handling (audit C3 partial)
`apps/web/app/api/billing/checkout/route.ts` — wrap the Stripe call in try/catch; on failure return `{ error: "Checkout could not be started." }` with status 502 (never leak the exception message). Full auth/webhook work happens in Phase 3.

### 1.10 Monte Carlo histogram (audit §5)
The chart at `apps/web/components/SimulationChart.tsx` renders pre-sorted quantile samples as a bar chart — always a smooth ascending ramp, visually meaningless. Fix on the API side: in `run_simulation` (`decision_engine.py:217-240`), replace the 40 sorted quantile points with a 24-bucket histogram of the samples (send bucket counts + min/max so the frontend can label the x-axis). Update `SimulationSummary` model, `apps/web/lib/types.ts`, and the chart to render the histogram with P10/P50/P90 markers. Update the existing pytest assertion accordingly.

### 1.11 Accessibility + theme quick wins (audit §5)
- `aria-label` on all icon-only buttons (theme toggle, reset, resolve true/false in `PredictionJournal.tsx`).
- Theme: initialize from `localStorage` falling back to `prefers-color-scheme`; persist on toggle (`page.tsx`).
- `ProbabilityPanel.tsx` bars: `role="progressbar"`, `aria-valuenow`.

### 1.12 CI hardening (audit S8)
`.github/workflows/ci.yml` — switch `npm install` → `npm ci`; pin all `uses:` actions to full commit SHAs (current major versions); add a ruff step (`pip install ruff && ruff check apps/api`) and add `ruff` to `apps/api/requirements.txt`. Add ESLint to `apps/web` (flat config, `next/core-web-vitals`), a root `lint` script, and a CI step for it. Fix any violations these surface.

### 1.13 Dead code: calibration endpoint
The frontend computes Brier locally (`apps/web/lib/calibration.ts`) and never calls `POST /api/predictions/score`. Keep the endpoint (it becomes useful with persistence) but add TestClient coverage for it, and add a shared-threshold note: interpretation thresholds (0.08/0.18/0.25) are duplicated in `decision_engine.py:370-377` and `calibration.ts:17-31` — add a comment in both pointing at the other.

**CHECKPOINT 1:** run full verification, report results, list commits.

---

## PHASE 2 — Backend correctness & tests (P1)

### 2.1 API endpoint test suite
New `apps/api/tests/test_api.py` using `fastapi.testclient.TestClient` (httpx already installed): health; analyze happy path (schema shape, camelCase aliases); 422s (short title/decision, oversized constraint item, >500 predictions); calibration edges (empty list → count 0, probability 0/1 boundary values); determinism (same request twice → same posterior/simulation).

### 2.2 De-circularize the simulation (audit §4, §9.2)
`run_simulation` currently centers a triangular distribution on the posterior and reports P(sample>50) — a noisy restatement of its input. Replace with a **scenario-mixture simulation**: for each of 5000 iterations, sample a scenario from the (now-normalized) scenario probabilities, then sample payoff from a triangular around that scenario's payoff (spread scaled by risk tolerance volatility as today). `successProbability` = share of iterations with payoff > 0. Pass scenarios into `run_simulation` (reorder calls in `build_analysis` as needed; scenarios are already built from the posterior, so the sim now reflects scenario structure rather than parroting the posterior). Use derived seeds (`random.Random(seed + 1)`) so streams don't overlap with `build_evidence` (audit "same seed, same stream"). Update tests; add a property test that successProbability is not identical to posterior across a set of varied requests.

### 2.3 Honest likelihood ratio (audit §4 partial, pre-research)
`update_probability` (`decision_engine.py:150-180`): LR is `clamp(0.75 + avg_confidence)` ≈ 1.45 always — a constant thumb on the scale. Until real research lands (Phase 4), make it symmetric: derive LR from the *balance* of signals, e.g. `LR = exp(k * (evidence_strength - 0.5 - risk_penalty))` clamped to [0.6, 1.75], so weak/risky evidence produces LR < 1 and the posterior can move down. Keep determinism. Update `rationale` text. Add tests: high `_keyword_risk` text → posterior below prior.

### 2.4 Typed overlay boundary
`ai_clients.py` / `main.py` — define a Pydantic `OverlayResponse(recommendation: str, next_steps: list[str])`, parse the model output into it inside `maybe_generate_ai_overlay`, return `OverlayResponse | None`. Update `main.py` merge to use attributes, not `dict.get`. Mock-based pytest for the merge path (patch `maybe_generate_ai_overlay`).

### 2.5 Percentile fix + unique analysis id
- `_percentile` truncates (biased low) — use linear interpolation or `statistics.quantiles`.
- `analysis.id` is stable per (decision, day) — switch to `uuid4().hex[:12]`; keep the seed for the RNG only. Update anything relying on id stability (frontend journal already appends `Date.now()` — simplify it to use the now-unique id).

### 2.6 CORS from env (audit S6)
`main.py` — read allowed origins from `CORS_ORIGINS` env (comma-separated), defaulting to the current localhost list. Drop `allow_credentials=True` (no cookies are used) and narrow methods to `["GET", "POST"]`. Add to `.env.example`.

### 2.7 Structured logging
Add a small logging setup in `main.py` (INFO default, uvicorn-compatible format) and log analyze requests (domain, title length — never full decision text) and overlay activation. No external services.

**CHECKPOINT 2:** full verification + report.

---## PHASE 3 — Persistence, auth, billing (P1)

> Requires user-provided credentials for full operation (Clerk keys, Stripe keys + webhook secret, running Postgres via `docker compose up postgres`). Build everything to no-op gracefully without them; use the local Postgres for migration + integration tests where possible.

### 3.1 Prisma schema hardening (audit §4)
`prisma/schema.prisma`: add missing FK indexes (`EvidenceCitation.decisionId`, `Scenario.decisionId`, `Risk.decisionId`, `SimulationRun.decisionId`, `Prediction.decisionId`, `Subscription.userId`); convert `Decision.status`, `Subscription.status`, `Subscription.plan` to enums (`DecisionStatus: DRAFT/ANALYZED/ARCHIVED`, `SubscriptionStatus: ACTIVE/PAST_DUE/CANCELED/INCOMPLETE`, `Plan: FREE/PRO`); add `Decision.analysisJson Json?` to store the full analysis payload; add `createdAt` to `Scenario`/`Risk`; add `VOID` to `PredictionOutcome`. Create the initial migration (`prisma migrate dev`) against local Postgres.

### 3.2 Persistence layer in the web app
Prisma client singleton (`apps/web/lib/db.ts`, gated: export null when `DATABASE_URL` unset). Next.js route handlers: `POST /api/decisions` (save decision + analysis JSON), `GET /api/decisions` (list own), `POST/PATCH /api/predictions` (save/resolve, including VOID). When DB or auth is unavailable, the frontend keeps using localStorage exactly as today — persistence is an upgrade, not a requirement.

### 3.3 Clerk middleware + route protection
`apps/web/middleware.ts` with `clerkMiddleware`, active only when Clerk keys are set. All `/api/decisions*`, `/api/predictions*`, `/api/billing/*` routes require a session when Clerk is enabled; map Clerk user → `User` row (create on first request). Sign-in button in the sidebar when Clerk is enabled.

### 3.4 Stripe properly (audit S1/C3)
- Checkout route: require authenticated user (when Clerk enabled; 401 otherwise), attach `client_reference_id` = user id, reuse/created `stripeCustomerId`.
- New `POST /api/billing/webhook`: verify signature with `STRIPE_WEBHOOK_SECRET`, handle `checkout.session.completed`, `customer.subscription.updated/deleted` → upsert `Subscription` rows. Raw-body handling per Stripe docs.
- `.env.example`: add `STRIPE_WEBHOOK_SECRET=""`.
- Tests: webhook signature rejection (unit-testable without real keys), checkout 401 when unauthenticated.

### 3.5 Journal sync UI
When signed in + DB available: load predictions from API, migrate existing localStorage entries once (then mark migrated), add un-resolve/void/delete controls to `PredictionJournal.tsx` (audit F5) and dedup on save (audit F2: disable Save after saving until analysis changes).

**CHECKPOINT 3:** full verification incl. migration on local Postgres; document exactly which features need which env keys in README.

---

## PHASE 4 — Research engine & product intelligence (P2)

> Ordered by value; each is an independent feature branch candidate. Confirm with the user before starting each, since these change product behavior.

### 4.1 Real research pipeline (audit C1 real fix, §9.1)
New `apps/api/app/services/research.py`: when `TAVILY_API_KEY` (or `EXA_API_KEY`) set, generate 3-5 queries from decomposition unknowns + decision text, search, score each result (recency, domain authority tier, relevance, independence — penalize same-root domains), classify direction (supports/contradicts/neutral) with one cheap LLM call when AI enabled, else keyword heuristic. Emit real `EvidenceCitation`s (real URLs, snippet, retrievedAt — extend the model). Feed directional per-source log-LRs into `update_probability`, replacing the Phase-2.3 stopgap. Deterministic fallback (current fabricated set, still labeled illustrative) when no keys. Tests with mocked HTTP.

### 4.2 Real specialist debate
Replace static debate text: one structured LLM call returns all seven personas, each with stance, argument grounded in the actual decomposition/evidence, and an independent probability; show the spread. Add a red-team persona (strongest case against the recommendation). Deterministic fallback = current static output. Provider strategy: default OpenAI (existing), add Anthropic client behind `AI_PROVIDER=anthropic` env using the already-declared `anthropic` dependency, cheap model for personas, stronger for final synthesis.

### 4.3 Calibration analytics
Once persistence exists: Brier decomposition (calibration/resolution/uncertainty), reliability curve endpoint (binned predicted vs observed, min 20 resolved), per-domain calibration summary. Frontend panel in the journal. Pure-math functions unit-tested first.

### 4.4 Scenario comparison
"Compare" mode: run up to 3 request variants, side-by-side EV/posterior/P(loss) deltas. API accepts a list; frontend tabbed compare view.

### 4.5 Simulation depth
Dollar-denominated payoffs when budget parseable; P(loss) + CVaR(10%) in `SimulationSummary`; tornado sensitivity (re-run engine with each input perturbed, rank by EV delta).

### 4.6 Journal & dashboard polish
Overdue-prediction surfacing; probability re-forecast history per prediction (schema: `PredictionUpdate` rows); CSV export; recommendation state as colored badge (Proceed/Evidence sprint/Don't commit); "what would change my mind" line under the recommendation fed by 4.5's top sensitivity driver; timeline steps scroll to their panel; preset-overwrite confirmation when form is dirty; collapse timeline on mobile.

### 4.7 E2E
Playwright: analyze sample decision → save prediction → resolve → Brier renders. Wire into CI behind a `test:e2e` script.

---

## Definition of done (per phase)

- All five verification commands green.
- New/changed behavior covered by tests; the specific audit bugs (C2, C4, C5) each have a regression test.
- No API keys required for any test or for `npm run dev`.
- Commits small, one per task, audit-tagged.
- Final summary: what shipped, what was skipped and why, anything discovered that contradicts this brief.
