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
npm run typecheck
npm run test:web
source .venv/bin/activate && npm run test:api
npm run build
npm run mobile:build
npm run mobile:android:debug
npm run mobile:ios:sim
DATABASE_URL="postgresql://oracle:oracle@localhost:5432/oracle" npx prisma validate
```

## Docker

```bash
docker compose up --build
```

## MVP Scope

The implemented MVP includes:

- Decision workspace
- Topic presets for common analysis styles
- Decomposition into goals, constraints, assumptions, risks, unknowns, stakeholders, and success metrics
- Citation-shaped research evidence
- Best/base/worst/black-swan forecast scenarios
- Bayesian probability update
- Monte Carlo simulation
- Specialist AI debate report
- Risk matrix
- Decision recommendation report
- Prediction journal and Brier score calibration
