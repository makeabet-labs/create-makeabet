# MakeABet Scaffold Enhancements – Roadmap & Context

## 1. Current Scope Snapshot

The `create-makeabet` CLI currently generates a Turbo monorepo with:

- Apps: `web` (Vite + React 19), `api` (Fastify), `worker` (BullMQ), `contracts` (Hardhat)
- Packages: `shared-core`, `config`
- Dev infra: Postgres + Redis via `docker-compose`, `Makefile`, Railway deployment template, Procfile
- Frontend wallet providers for EVM (RainbowKit/Wagmi) and Solana (Wallet Adapter). Basic dashboard surfaces target chain, RPC, PYUSD address, basic balances (native + stable) when connected.
- API exposes `/health` and `/api/config`.

## 2. Pending Enhancements (ordered plan)

### 2.1 Wallet & UI Improvements
- Surface native & PYUSD balances with better status states.
- Integrate block explorer deep links (per chain).
- Adopt a `ChainProvider` pattern to expose selected chain, chain metadata, and allow toggling.
- Mirror best practices from existing MakeABet repo and scaffold-eth-2 for wallet UX.

### 2.2 Chain Toggle + Local/Remote Support
- Support toggling between `local-hardhat` and user-selected testnet (Sepolia / Arbitrum Sepolia / Solana Devnet).
- `ChainSwitcher` UI component to swap active chain.
- `WalletProvider` rebuilds configuration when chain changes (EVM vs Solana).
- Auto-synchronize environment variables/UI whenever chain changes.

### 2.3 Local Hardhat Automation
- `pnpm chain`: start Hardhat node (0.0.0.0:8545).
- `pnpm deploy:local`: deploy mock PYUSD + MakeABetMarket to local network, write deployment artifacts (`deployments/local.json`, update `.env.local` / `apps/web/.env.local`).
- Root `pnpm dev`: run chain + wait for port 8545 + deploy local contracts + `turbo run dev`. Uses `concurrently` + `wait-on`.
- `Makefile` additions for `chain`, `deploy-local`, `dev-with-chain`.

### 2.4 Faucets & API Extensions
- Hardhat deployment seeds faucet signer with ETH & PYUSD.
- API adds `/api/faucet` (only active on local chain). Issues 1 ETH + 100 PYUSD to caller.
- Frontend displays `Request Faucet` button whilst on local-hardhat and wallet connected. Show toast with results.

### 2.5 Template/Docs Updates
- `.env.example`, `apps/web/.env.example` include local chain configs (`LOCAL_CHAIN_ENABLED`, `LOCAL_RPC_URL`, `LOCAL_PYUSD_ADDRESS`, `VITE_CHAIN_DEFAULT`, etc).
- README + README_TW describe new flow (`pnpm install → pnpm dev` launches Hardhat + deploy + dev servers), faucet usage, chain switching.
- Provide `deployments/local.json` skeleton and ensure `.gitignore` excludes generated artifacts.

## 3. Implementation Work Breakdown

### 3.1 Frontend
- Introduce global chain context, chain metadata, switcher component.
- Expand wallet summary card: block explorer links, toggle for local/testnet, balance display.
- Integrate faucet button and status notifications.
- Ensure React 19 compatibility (avoid Node globals; rely on `import.meta.env`).

### 3.2 Backend / Worker
- Extend Fastify `/api/config` to include active chain info, local deployment state.
- Add `/api/faucet` (conditional on local-hardhat) with Hardhat signer integration.
- Worker remains responsible for settlement queue; no changes expected unless local mode needs watermarks.

### 3.3 Contracts & Scripts
- Update Hardhat project: deploy script for mock PYUSD, MakeABetMarket, faucet signer.
- Write `deploy/local.ts` (ethers scripts) storing addresses to `deployments/local.json`.
- Provide helper script to top-up faucet (if needed).

### 3.4 CLI / Templates
- Embed new commands in generated `package.json`, `Makefile`.
- Create default `.env.local` referencing local deployment once generated.
- Ensure CLI writes updated `.env.example` values and instructions.
- Document chain toggle/faucet workflow in generated README.

## 4. Risks / Considerations
- WalletConnect requires valid project ID; fallback to injected connectors when absent (already implemented).
- Hardhat automation must gracefully exit when chain already running (avoid duplicates).
- Faucet endpoint should be disabled in production/testnet builds (guard on `CHAIN_TYPE`).
- Solana PYUSD balances rely on RPC; handle errors/timeouts gracefully.

## 5. Next Steps
1. Implement ChainProvider + WalletSummary UI updates (Step 2.1).
2. Add chain toggle & dynamic provider rebuild (Step 2.2).
3. Automate local Hardhat workflow (`pnpm chain`, `pnpm deploy:local`, updated `pnpm dev`) (Step 2.3).
4. Build faucet endpoint + UI (Step 2.4).
5. Update templates, README, `.env` scaffolding (Step 2.5).
6. Regenerate CLI build (`pnpm --filter @makeabet/create build`) and validate new project scaffolds end-to-end.
