# Oracle

Oracle is an AI-ready Decision Intelligence Platform for decisions under uncertainty. The MVP turns an open-ended decision into assumptions, evidence, scenarios, probabilities, simulations, risks, a recommendation, and a prediction journal for calibration over time.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic
- Database: PostgreSQL schema managed with Prisma
- Auth and payments: Clerk and Stripe integration points
- AI and search: OpenAI Responses API, Anthropic, Tavily/Exa integration points
- Deployment: Docker, Vercel-compatible web app, Railway-compatible API

## Local Development

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
npm run dev
```

The web app runs on `http://localhost:3000` and the API runs on `http://localhost:8001`.

Copy `.env.example` to `.env` when connecting real services. The MVP works without API keys by using deterministic local analysis.

## Verification

```bash
npm run typecheck
npm run test:web
source .venv/bin/activate && npm run test:api
npm run build
DATABASE_URL="postgresql://oracle:oracle@localhost:5432/oracle" npx prisma validate
```

## Docker

```bash
docker compose up --build
```

## MVP Scope

The implemented MVP includes:

- Decision workspace
- Decomposition into goals, constraints, assumptions, risks, unknowns, stakeholders, and success metrics
- Citation-shaped research evidence
- Best/base/worst/black-swan forecast scenarios
- Bayesian probability update
- Monte Carlo simulation
- Specialist AI debate report
- Risk matrix
- Decision recommendation report
- Prediction journal and Brier score calibration
