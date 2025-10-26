# 🎯 MakeABet - 去中心化預測市場平台

基於 Pyth Network 的加密貨幣預測市場，讓用戶可以對價格走勢進行預測和下注。

## ✨ 核心功能

- 🎲 **預測市場** - 創建和參與加密貨幣價格預測
- 📊 **實時價格** - 整合 Pyth Network 價格預言機
- 💰 **PYUSD 下注** - 使用 PYUSD 穩定幣進行交易
- 🔗 **智能合約** - 去中心化的市場結算
- 📱 **響應式 UI** - 專業的用戶界面

## 🚀 一鍵啟動

```bash
pnpm dev
```

就這麼簡單！這個命令會：
1. ✅ 啟動 Hardhat 本地節點
2. ✅ 部署智能合約
3. ✅ 啟動 API 和 Web 服務器

然後打開 http://localhost:5173

## 📚 文檔

- **[快速開始](./QUICK_START.md)** - 最快的啟動方式
- **[文檔中心](./docs/README.md)** - 完整的文檔導航
- **[開發歷程](./docs/development-history/INDEX.md)** - 30+ 詳細文檔

## 🛠️ 技術棧

- **Hardhat 3**：智能合約開發和測試
- **React 19**：現代化的前端框架
- **Fastify API**：高性能後端服務
- **Pyth Network**：實時價格預言機
- **PYUSD**：PayPal 穩定幣整合
- **RainbowKit**：錢包連接

## 環境需求

- **Node.js**: >= 22.0.0 (建議使用 22.10.0 或更高版本)
- **pnpm**: >= 9.0.0
- **Docker**: 用於本地 Postgres 和 Redis

> 💡 **提示**: 使用 `nvm use` 或 `fnm use` 自動切換到專案指定的 Node.js 版本（參考 `.nvmrc` 文件）

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

## Performance Optimization

The scaffold is optimized for production performance with:

- **Code Splitting**: Automatic vendor chunking and lazy loading
- **Bundle Optimization**: Configured Vite build with tree-shaking
- **Modern Build Target**: ES2020 for smaller bundles
- **Optimized Dependencies**: Pre-bundled common libraries

### Analyze Bundle Size

Check your production bundle size:

```bash
pnpm analyze:bundle
```

This will build the app and provide detailed analysis of:
- JavaScript bundle sizes
- CSS bundle sizes
- Recommendations for optimization
- Performance warnings

### Performance Testing

For comprehensive performance testing:

```bash
# Run Lighthouse audit
pnpm --filter @makeabet/web build
pnpm --filter @makeabet/web preview
# Then open Chrome DevTools → Lighthouse

# Test on slow network
# Chrome DevTools → Network → Throttling → Slow 3G
```

### Performance Documentation

- [PERFORMANCE.md](PERFORMANCE.md) - Optimization guide and best practices
- [PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md) - Detailed testing procedures

### Target Metrics

- **Initial Load**: < 3 seconds on 3G
- **Bundle Size**: < 500KB (gzipped)
- **Lighthouse Score**: > 90 on all metrics

更多資訊請參考 `docs/` 內的 PRD 與技術設計文件模板。
