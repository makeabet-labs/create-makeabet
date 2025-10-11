# create-makeabet

`create-makeabet` is the official scaffold generator for the MakeABet hackathon stack. It bootstraps a Turbo monorepo that is ready for the Hardhat Builders Challenge, PayPal USD (PYUSD) prizes, and Pyth Network integration.

## Prerequisites

- Node.js 20+ (22 recommended)
- pnpm 9+
- Git, Docker (for local Postgres/Redis), and a Railway account if you plan to deploy to Railway

## Quick Start (local CLI)

```bash
# Clone and install once
git clone <repo-url> create-makeabet
cd create-makeabet
pnpm install

# Build the CLI
pnpm --filter @makeabet/create build

# Generate a new project (interactive prompts)
node packages/create-makeabet/dist/cli.js my-makeabet-app
```

## Usage Options

You can also pass arguments to skip prompts:

```bash
node packages/create-makeabet/dist/cli.js my-app \
  --merchant \
  --chain sepolia \
  --package-manager pnpm
```

Flags:
- `--merchant` / `-m` – keep the merchant portal module (omit to remove it)
- `--chain <sepolia|arbitrum-sepolia|base-sepolia>` – default `sepolia`
- `--package-manager <pnpm|npm|yarn>` – default `pnpm`

## Scaffold Contents

The generated workspace contains:

- `apps/contracts` – Hardhat + Pyth pull-oracle scripts (`deploy`, `createRoom`, `settleRoom`)
- `apps/api` – Fastify 5 API with Prisma, ORPC shell, PayPal/Pyth configuration endpoints
- `apps/worker` – BullMQ worker for price updates and settlements
- `apps/web` – Vite + React 19 SPA showing PayPal/PYUSD flow, ready for customization
- `docker-compose.yml` & `Makefile` – Postgres/Redis dev stack and helper commands
- `deploy/railway.json` & `Procfile` – turn-key Railway deployment template
- `docs/templates/*` – Hackathon briefing templates (Hardhat/PYUSD/Pyth focus)

Merchant-specific stubs live under `apps/web/src/modules/merchant` and `apps/api/src/modules/merchant`. When the CLI is run without `--merchant`, these folders (and docs) are removed automatically.

## Working With a Generated Project

```bash
cd my-makeabet-app
pnpm install

# Start Postgres & Redis locally
make docker-up

# Generate Prisma client & run migrations (API package)
pnpm --filter @makeabet/api prisma:generate
pnpm --filter @makeabet/api prisma:migrate

# Start dev services (web, api, worker)
pnpm dev
```

### Hardhat Tasks

```bash
pnpm --filter @makeabet/contracts compile
pnpm --filter @makeabet/contracts test
pnpm --filter @makeabet/contracts run scripts/deploy.ts
```

Be sure to fill in `.env` (copied from `.env.example`) with:

- `DATABASE_URL`, `REDIS_URL`
- PayPal sandbox credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
- Pyth Hermes endpoint & feed IDs (`PYTH_PRICE_SERVICE_URL`, `PYTH_FEED_ID`)
- Hardhat RPC URLs and private keys (e.g. `ALCHEMY_SEPOLIA_URL`, `DEPLOYER_KEY`)

### Railway Deployment

1. Commit the generated project to GitHub.
2. From the project README, click the “Deploy on Railway” button (or create a Railway project manually using `deploy/railway.json`).
3. Railway provisions Postgres + Redis plug-ins and launches two services defined in `Procfile`:
   - `web` → `pnpm --filter @makeabet/api start`
   - `worker` → `pnpm --filter @makeabet/worker start`
4. Provide the same environment variables you used locally (Railway auto-fills database URLs via `${{postgres.DATABASE_URL}}`, `${{redis.REDIS_URL}}`).
5. Deploy the web frontend separately (Railway Static or Vercel) and point it at the API URL.

## Development Notes

- The CLI code lives in `packages/create-makeabet`. Run `pnpm --filter @makeabet/create dev` for watch mode.
- Template files live in `templates/monorepo`. Adjust them before building/publishing the CLI.
- Keep the CLI up to date with your hackathon progress (e.g., add new scripts or docs as the product evolves).
