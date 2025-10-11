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
pnpm dev
```

### 本地基礎設施

```bash
make docker-up
```

- Postgres：`postgresql://makeabet:makeabet@localhost:5432/makeabet`
- Redis：`redis://default:makeabet@localhost:6379`

### Hardhat 指令

```bash
pnpm --filter @makeabet/contracts compile
pnpm --filter @makeabet/contracts test
pnpm --filter @makeabet/contracts run scripts/deploy.ts
```

### Railway 部署

1. 將 `.env.example` 複製為 `.env` 並填入 PayPal / Pyth / Sepolia 金鑰。
2. 以 GitHub 推送至專案後，點擊 README 內的「Deploy on Railway」按鈕。
3. Railway 會自動建立 Node 服務 + Postgres + Redis，並啟用 `Procfile` 對應的 API/Worker。前端可部署至 Vercel 或 Railway Static。

更多資訊請參考 `docs/` 內的 PRD 與技術設計文件模板。
