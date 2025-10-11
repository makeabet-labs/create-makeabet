# create-makeabet（繁體中文）

`create-makeabet` 是 MakeABet 黑客松官方腳手架，能快速建立一套符合 Hardhat Builders Challenge、PayPal USD (PYUSD)、Pyth Network 需求的 Turbo monorepo。

## 環境需求

- Node.js 20 以上（建議 22）
- pnpm 9+
- Git、Docker（供本地 Postgres/Redis 使用）、若要部署 Railway 需有 Railway 帳號

## 快速開始（本地 CLI）

```bash
# 先Clone並安裝依賴
git clone <repo-url> create-makeabet
cd create-makeabet
pnpm install

# 建置 CLI
pnpm --filter @makeabet/create build

# 呼叫 CLI（互動式）
node packages/create-makeabet/dist/cli.js my-makeabet-app
```

## 參數使用

```bash
node packages/create-makeabet/dist/cli.js my-app \
  --merchant \
  --chain sepolia \
  --package-manager pnpm
```

參數說明：
- `--merchant` / `-m`：保留商家模組（預設會詢問，取消則自動移除對應檔案）
- `--chain <sepolia|arbitrum-sepolia|base-sepolia>`：預設 `sepolia`
- `--package-manager <pnpm|npm|yarn>`：預設 `pnpm`

## 生成內容概覽

- `apps/contracts`：Hardhat + Pyth pull-oracle 腳本（`deploy`、`createRoom`、`settleRoom`）
- `apps/api`：Fastify 5 API，內建 Prisma 與 PayPal/Pyth 設定端點
- `apps/worker`：BullMQ Worker 處理價格更新與結算
- `apps/web`：Vite + React 19 前端，展示 PayPal/PYUSD 流程
- `docker-compose.yml`、`Makefile`：本地 Postgres/Redis 與常用指令
- `deploy/railway.json`、`Procfile`：Railway 部署範本
- `docs/templates/*`：黑客松簡報模板（Hardhat / PYUSD / Pyth）

若建立時未啟用商家模組，CLI 會自動刪除 `apps/web/src/modules/merchant`、`apps/api/src/modules/merchant` 與相關文件。

## 使用腳手架專案

```bash
cd my-makeabet-app
pnpm install

# 啟動 Postgres & Redis
make docker-up

# Prisma Client 與遷移
pnpm --filter @makeabet/api prisma:generate
pnpm --filter @makeabet/api prisma:migrate

# 啟動開發環境（web, api, worker）
pnpm dev
```

### Hardhat 指令

```bash
pnpm --filter @makeabet/contracts compile
pnpm --filter @makeabet/contracts test
pnpm --filter @makeabet/contracts run scripts/deploy.ts
```

請依 `.env.example` 補齊：

- `DATABASE_URL`、`REDIS_URL`
- PayPal Sandbox (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
- Pyth Hermes 與 Feed (`PYTH_PRICE_SERVICE_URL`, `PYTH_FEED_ID`)
- Hardhat RPC、私鑰 (`ALCHEMY_SEPOLIA_URL`, `DEPLOYER_KEY` 等)

### Railway 部署流程

1. 將專案推到 GitHub。
2. 點選 README 的「Deploy on Railway」按鈕（或在 Railway 新建專案並匯入 `deploy/railway.json`）。
3. Railway 自動建立 Postgres / Redis 插件，並啟動 `Procfile` 對應的兩個服務：
   - `web` → `pnpm --filter @makeabet/api start`
   - `worker` → `pnpm --filter @makeabet/worker start`
4. Railway 會注入資料庫 URL，其餘環境變數請依 `.env` 填寫。
5. 前端可部署到 Railway Static 或 Vercel，再指向 API 位址。

## 開發注意事項

- CLI 原始碼在 `packages/create-makeabet`，可用 `pnpm --filter @makeabet/create dev` 進入 watch 模式。
- 模板在 `templates/monorepo/`，調整內容後再重建 CLI。
- 隨著 MakeABet 專案演進，記得同步更新腳手架的模板與文檔。
