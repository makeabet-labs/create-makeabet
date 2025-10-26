# 🚂 Railway 部署指南

## 快速部署到 Railway

### 方法 1: 使用 Railway CLI（推薦）

#### 1. 安裝 Railway CLI
```bash
npm i -g @railway/cli
```

#### 2. 登入 Railway
```bash
railway login
```

#### 3. 初始化項目
```bash
cd templates/monorepo
railway init
```

#### 4. 部署
```bash
railway up
```

---

### 方法 2: 使用 GitHub（最簡單）

#### 1. 推送到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

#### 2. 在 Railway 創建項目
1. 訪問 https://railway.app
2. 點擊 "New Project"
3. 選擇 "Deploy from GitHub repo"
4. 選擇你的倉庫
5. Railway 會自動檢測並部署

---

## 📦 需要部署的服務

### 1. API 服務
- **路徑**: `apps/api`
- **構建命令**: `pnpm install && pnpm --filter @makeabet/api build`
- **啟動命令**: `pnpm --filter @makeabet/api start`
- **端口**: 4000

### 2. Web 服務
- **路徑**: `apps/web`
- **構建命令**: `pnpm install && pnpm --filter @makeabet/web build`
- **啟動命令**: `pnpm --filter @makeabet/web preview`
- **端口**: 5173

---

## 🔧 環境變量配置

### API 服務環境變量
```env
NODE_ENV=production
PORT=4000

# Chain Configuration
CHAIN_TYPE=evm
TARGET_CHAIN=sepolia
LOCAL_CHAIN_ENABLED=false

# Sepolia Configuration
EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PYUSD_CONTRACT_ADDRESS=<sepolia-pyusd-address>

# Pyth
PYTH_PRICE_SERVICE_URL=https://hermes.pyth.network

# PayPal (Optional)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

### Web 服務環境變量
```env
NODE_ENV=production

# API URL
VITE_API_URL=https://your-api.railway.app

# Chain Configuration
VITE_CHAIN_TYPE=evm
VITE_TARGET_CHAIN=sepolia
VITE_LOCAL_CHAIN_ENABLED=false

# Sepolia Configuration
VITE_EVM_CHAIN_ID=11155111
VITE_EVM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_PYUSD_ADDRESS=<sepolia-pyusd-address>

# Contract Addresses (部署到 Sepolia 後填寫)
VITE_MARKET_CONTRACT_ADDRESS=<deployed-market-address>
VITE_PYUSD_CONTRACT_ADDRESS=<sepolia-pyusd-address>

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

---

## 📝 Railway 配置文件

創建 `railway.json`：

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

創建 `Procfile`（已存在）：
```
web: pnpm --filter @makeabet/web preview
api: pnpm --filter @makeabet/api start
```

---

## 🎯 部署步驟

### 步驟 1: 準備代碼
```bash
# 確保所有依賴已安裝
pnpm install

# 構建所有服務
pnpm build
```

### 步驟 2: 部署到 Sepolia

#### 2.1 獲取 Sepolia ETH
- 訪問 https://sepoliafaucet.com/
- 或 https://www.alchemy.com/faucets/ethereum-sepolia

#### 2.2 部署合約
```bash
# 設置環境變量
export PRIVATE_KEY=<your-private-key>
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 部署
pnpm --filter @makeabet/contracts deploy:sepolia
```

#### 2.3 記錄合約地址
部署後會顯示：
```
MockPYUSD deployed to: 0x...
MakeABetMarket deployed to: 0x...
```

### 步驟 3: 配置 Railway

#### 3.1 創建 API 服務
1. 在 Railway 創建新服務
2. 選擇 "Empty Service"
3. 連接 GitHub 倉庫
4. 設置根目錄為 `apps/api`
5. 添加環境變量（見上方）

#### 3.2 創建 Web 服務
1. 創建另一個服務
2. 連接同一個倉庫
3. 設置根目錄為 `apps/web`
4. 添加環境變量（見上方）
5. 設置 `VITE_API_URL` 為 API 服務的 URL

### 步驟 4: 部署
```bash
railway up
```

---

## 🔍 驗證部署

### 檢查 API
```bash
curl https://your-api.railway.app/health
# 應該返回: {"status":"ok"}
```

### 檢查 Web
訪問 `https://your-web.railway.app`

---

## 🐛 常見問題

### Q: 構建失敗 "out of memory"
**A**: 在 Railway 設置中增加內存限制

### Q: 找不到模塊
**A**: 確保 `pnpm install` 在構建命令中

### Q: 環境變量不生效
**A**: 
1. 確認變量名正確（VITE_ 前綴）
2. 重新部署服務

### Q: CORS 錯誤
**A**: 在 API 的 `router.ts` 中添加 CORS 配置

---

## 💡 優化建議

### 1. 使用 Railway 的 PostgreSQL
```bash
railway add postgresql
```

### 2. 使用 Railway 的 Redis
```bash
railway add redis
```

### 3. 設置自定義域名
在 Railway 項目設置中添加自定義域名

### 4. 啟用自動部署
連接 GitHub 後，每次推送都會自動部署

---

## 📊 成本估算

Railway 免費計劃：
- ✅ $5 免費額度/月
- ✅ 最多 2 個服務
- ✅ 512MB RAM
- ✅ 1GB 存儲

對於 demo 和測試完全足夠！

---

## 🚀 快速命令

```bash
# 部署所有服務
railway up

# 查看日誌
railway logs

# 打開服務
railway open

# 查看環境變量
railway variables

# 連接到數據庫
railway connect
```

---

## 📝 部署檢查清單

- [ ] 代碼已推送到 GitHub
- [ ] 合約已部署到 Sepolia
- [ ] 獲取了 Infura/Alchemy API Key
- [ ] 設置了 WalletConnect Project ID
- [ ] 配置了所有環境變量
- [ ] API 服務已部署
- [ ] Web 服務已部署
- [ ] 測試了所有功能

---

**準備好了嗎？開始部署吧！** 🚂✨
