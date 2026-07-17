# Oracle

Oracle is a Decision Intelligence Platform for decisions under uncertainty. The MVP turns an open-ended decision into assumptions, evidence, scenarios, probabilities, simulations, risks, a recommendation, action items, and a prediction journal for calibration over time.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic
- Database: PostgreSQL schema managed with Prisma
- Auth and payments: Clerk and Stripe
- AI and search: OpenAI Responses API and Tavily/Exa, with deterministic fallbacks when keys are missing
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

Copy `.env.example` to `.env` when connecting real services. The app works without API keys by using deterministic local analysis and clearly marked illustrative evidence.

## Runtime Modes

Oracle separates deterministic forecasting from outside services:

- The local decision engine owns probability, scenario, risk, simulation, and calibration numbers.
- OpenAI can improve written recommendations when `OPENAI_API_KEY` is present, but failures fall back to deterministic output.
- Tavily or Exa can provide live research citations when `TAVILY_API_KEY` or `EXA_API_KEY` is present.
- Without search keys, evidence is marked `illustrative`; users should treat it as a structured starting point, not verified research.
- Clerk and Stripe are optional at runtime unless `ORACLE_REQUIRE_AUTH=true`.

Key production environment variables:

```bash
OPENAI_API_KEY=""
TAVILY_API_KEY=""
EXA_API_KEY=""
ORACLE_CORS_ORIGINS="https://your-web-domain.com"
ORACLE_REQUIRE_AUTH="false"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PRICE_ID=""
NEXT_PUBLIC_APP_URL="https://your-web-domain.com"
DATABASE_URL="postgresql://..."
```

## Implemented MVP Surface

- Guided decision workspace with built-in and user-saved presets
- Client-side validation and bounded API models for safer inputs
- Decomposition into goals, constraints, assumptions, risks, unknowns, stakeholders, and success metrics
- Live Tavily/Exa research integration with citation status, direction, confidence, summaries, and fallback labels
- Bayesian probability update using evidence direction and confidence
- Scenario-mixture Monte Carlo simulation with success probability, loss probability, and expected shortfall
- Best/base/worst/black-swan forecast scenarios
- Specialist debate panel with explicit red-team critique
- Risk matrix and accessible heatmap
- Decision report with recommendation level, confidence, evidence strength, risks, opportunities, next steps, and "what would change my mind"
- Local-first decision history, action tracker, comparison panel, and prediction journal
- Calibration analytics with Brier score, confidence bins, resolved/open/voided counts, and improvement guidance
- Optional authenticated decision-history persistence through Prisma
- Stripe checkout and webhook subscription persistence when credentials are configured
- Embedded instruction manual and glossary inside the app

## Mobile Apps

Oracle now includes a Capacitor mobile shell for Android and iOS/Xcode. The mobile app is built from `apps/mobile`, reuses the production React decision workspace, and syncs the compiled bundle into the native projects in `android/` and `ios/`.

```bash
npm run mobile:build
npm run mobile:sync
npm run mobile:android:debug
npm run mobile:ios:sim
```

Native targets:

- Android package: `com.nakedeyent.oracle`
- iOS bundle identifier: `com.nakedeyent.oracle`
- App name: `Oracle`

Open the native projects with:

```bash
npm run mobile:open:android
npm run mobile:open:ios
```

For local Android builds on this machine, use JDK 21. The package scripts default to `/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` when `JAVA_HOME` is not already set. Store deployment still requires production signing credentials, Apple/Google developer accounts, and a deployed HTTPS API URL via `VITE_ORACLE_API_BASE_URL`.

For simulator/device testing, set `VITE_ORACLE_API_BASE_URL` before `npm run mobile:sync`. Android emulator uses the host machine at `http://10.0.2.2:8001`; iOS Simulator can usually use `http://localhost:8001`. Store builds should use a hosted HTTPS API URL.

For Android Play Store signing, export these locally before running `npm run mobile:android:bundle`:

```bash
export ORACLE_ANDROID_KEYSTORE_PATH="/absolute/path/to/oracle-upload-key.jks"
export ORACLE_ANDROID_KEYSTORE_PASSWORD="..."
export ORACLE_ANDROID_KEY_ALIAS="..."
export ORACLE_ANDROID_KEY_PASSWORD="..."
```

Without those variables, Gradle still produces `android/app/build/outputs/bundle/release/app-release.aab`, but it is unsigned and must not be uploaded directly to Play Console.

## Verification

```bash
npm install
npm run typecheck
npm --workspace apps/mobile run typecheck
npm run test:web
source .venv/bin/activate && npm run test:api
npm run test:e2e
npm run build
npm run mobile:build
npm run mobile:sync
npm run mobile:android:debug
npm run mobile:android:bundle
npm run mobile:ios:sim
DATABASE_URL="postgresql://oracle:oracle@localhost:5432/oracle" npm run prisma:validate
```

`npm run test:e2e` launches the local API and web app, submits a decision through the browser, and verifies that the report renders with illustrative evidence when live research is not configured.

## Docker

```bash
docker compose up --build
```

## Production Gaps

- Real collaboration/team accounts
- Hosted production API and database
- Clerk and Stripe production credentials
- App Store/TestFlight upload and Play Store upload
- Real search billing keys for Tavily or Exa
- Human review of calibrated model assumptions before high-stakes use
