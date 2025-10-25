# MakeABet Hackathon Scaffold

這個腳手架由 `create-makeabet` CLI 產生，預設整合硬體：

- **Hardhat**：部署與測試 PYUSD 預測市場合約，內建 Pyth pull oracle 與商家房間管理腳本。
- **Fastify API + Worker**：`apps/api` 提供 PayPal/PYUSD/Pyth 相關的應用層 API，`apps/worker` 定時更新 Pyth 價格與結算。
- **Next.js / React 前端**：`apps/web` 展示下注流程、PayPal OAuth、商家後台入口。
- **Redis + Postgres**：Docker Compose 預設服務，搭配 `Makefile` 指令啟動。
- **Railway 部署範本**：`deploy/railway.json` 與 README 範例，支援一鍵建立雲端環境。

## 快速開始

```bash
pnpm install
docker compose up -d    # 啟動 Postgres & Redis
pnpm dev
```

- Postgres：`postgresql://makeabet:makeabet@localhost:5432/makeabet`
- Redis：`redis://default:makeabet@localhost:6379`

### 本地基礎設施

```bash
docker compose up -d
# 或使用 Makefile
# make docker-up
```

### Hardhat 指令

```bash
pnpm --filter @makeabet/contracts compile
pnpm --filter @makeabet/contracts test
pnpm --filter @makeabet/contracts run scripts/deploy.ts
```

### Railway Deployment

Deploy the backend services (API + Worker) to Railway with one click:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/makeabet?referralCode=makeabet)

#### What Gets Deployed

Railway will automatically provision:
- **Postgres Database** - Stores user data, bets, and market information
- **Redis Instance** - Handles job queues and caching
- **API Service** - Fastify server handling HTTP requests
- **Worker Service** - Background jobs for Pyth price updates and market settlement

#### Required Environment Variables

After clicking the deploy button, you'll need to configure these variables in Railway:

**Required:**
- `PAYPAL_CLIENT_ID` - Your PayPal REST API client ID
- `PAYPAL_CLIENT_SECRET` - Your PayPal REST API secret
- `TARGET_CHAIN` - Target blockchain (e.g., `sepolia`, `arbitrum-sepolia`, `solana-devnet`)
- `CHAIN_TYPE` - Chain type (`evm` or `solana`)
- `EVM_RPC_URL` - RPC endpoint for EVM chains (e.g., Alchemy, Infura, or public RPC)
- `PYUSD_CONTRACT_ADDRESS` - PYUSD token address for your target chain
- `MARKET_CONTRACT_ADDRESS` - Your deployed MakeABetMarket contract address
- `PYTH_FEED_ID` - Pyth price feed ID for your market

**Optional:**
- `PYTH_PRICE_SERVICE_URL` - Defaults to `https://hermes.pyth.network`
- `WALLETCONNECT_PROJECT_ID` - For WalletConnect support
- `ENABLE_MERCHANT_PORTAL` - Set to `true` to enable merchant features
- `SOLANA_RPC_URL` - Required if using Solana
- `PYUSD_MINT_ADDRESS` - Required if using Solana

**Auto-Injected by Railway:**
- `DATABASE_URL` / `POSTGRES_URL` - Automatically set by Postgres plugin
- `REDIS_URL` - Automatically set by Redis plugin
- `NODE_ENV` - Set to `production`

#### Frontend Deployment

The frontend (`apps/web`) should be deployed separately to a static hosting service:

**Option 1: Vercel (Recommended)**
1. Import your GitHub repository to Vercel
2. Set root directory to `apps/web`
3. Configure environment variables (see `apps/web/.env.example`)
4. Set `VITE_API_URL` to your Railway API URL

**Option 2: Railway Static Site**
1. Add a new service in your Railway project
2. Set build command: `pnpm --filter @makeabet/web build`
3. Set output directory: `apps/web/dist`
4. Configure environment variables

**Option 3: Netlify**
1. Import your GitHub repository
2. Set base directory to `apps/web`
3. Set build command: `pnpm build`
4. Set publish directory: `dist`

#### Deployment Steps

1. **Deploy Contracts First**
   ```bash
   # Deploy to your target testnet (Sepolia, Arbitrum Sepolia, etc.)
   pnpm --filter @makeabet/contracts run scripts/deploy.ts --network sepolia
   ```
   Save the deployed contract addresses.

2. **Click Deploy on Railway**
   - Click the "Deploy on Railway" button above
   - Connect your GitHub account
   - Select your repository
   - Railway will read `deploy/railway.json` and provision services

3. **Configure Environment Variables**
   - Go to your Railway project settings
   - Add all required environment variables listed above
   - Use the contract addresses from step 1

4. **Deploy Frontend**
   - Choose your preferred hosting (Vercel/Netlify/Railway)
   - Configure frontend environment variables
   - Set `VITE_API_URL` to your Railway API URL (e.g., `https://your-api.railway.app`)

5. **Verify Deployment**
   - Check Railway logs for API and worker services
   - Test API endpoints: `https://your-api.railway.app/api/config`
   - Open your frontend and test the full flow

#### Troubleshooting

**Services won't start:**
- Check Railway logs for error messages
- Verify all required environment variables are set
- Ensure Postgres and Redis plugins are running

**Database connection errors:**
- Verify `DATABASE_URL` is set (should be auto-injected)
- Check Postgres plugin status
- Try restarting the API service

**Worker not processing jobs:**
- Check worker logs in Railway
- Verify `REDIS_URL` is set correctly
- Ensure Pyth configuration is correct

**API returns 500 errors:**
- Check API logs for stack traces
- Verify RPC URL is accessible
- Test contract addresses are correct

For more information, see:
- [Railway Deployment Guide](docs/RAILWAY_DEPLOYMENT.md) - Comprehensive deployment documentation
- [Railway Testing Checklist](docs/RAILWAY_TESTING_CHECKLIST.md) - Deployment verification checklist
- [Railway Documentation](https://docs.railway.app/) - Official Railway docs
- Configuration file: `deploy/railway.json`

更多資訊請參考 `docs/` 內的 PRD 與技術設計文件模板。
