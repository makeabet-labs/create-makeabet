# create-makeabet（繁體中文）

`create-makeabet` 是 MakeABet 黑客松官方腳手架，能快速建立一套符合 **Hardhat 3 Builders Challenge**、**PayPal USD (PYUSD)**、**Pyth Network** 需求的 Turbo monorepo。

## 功能特色

✨ **Hardhat 3** - 最新 Hardhat，支援 Solidity 測試、Rust 效能優化、多鏈支援  
💵 **PYUSD 整合** - 本地開發使用 Mock PYUSD，Sepolia/Arbitrum 使用真實 PYUSD 地址  
🔮 **Pyth Oracle** - Pull oracle 模式，整合 Hermes API 與範例腳本  
🚀 **一鍵開發** - `pnpm dev` 啟動所有服務：鏈、部署、同步、伺服器  
🔄 **鏈切換** - 無縫切換本地 Hardhat、Sepolia、Arbitrum、Solana  
💧 **本地水龍頭** - 在本地網路即時領取測試 ETH 和 PYUSD  
☁️ **Railway 就緒** - 一鍵部署，自動配置 Postgres 和 Redis

## 環境需求

- **Node.js 22+**（22.10.0 或更高版本）- **Hardhat 3 必須**
- **pnpm 9+**
- **Git**
- **Docker**（供本地 Postgres/Redis 使用）
- **Railway 帳號**（選用，用於部署）

> 💡 **重要**: Hardhat 3 需要 Node.js 22 或更高版本。使用 `nvm use 22` 或 `fnm use 22` 切換版本。

## 快速開始（本地 CLI）

```bash
# 先 Clone 並安裝依賴
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
- `--chain <sepolia|arbitrum-sepolia|solana-devnet>`：預設 `sepolia`
- `--package-manager <pnpm|npm|yarn>`：預設 `pnpm`

## 生成內容概覽

- `apps/contracts`：**Hardhat 3** 含 Solidity 測試、Pyth pull-oracle 腳本、PYUSD mock 合約
- `apps/api`：Fastify 5 API，內建 Prisma、PayPal/Pyth 端點、本地水龍頭服務
- `apps/worker`：BullMQ Worker 處理價格更新與結算
- `apps/web`：Vite + React 19 前端，支援鏈切換、錢包摘要、PYUSD 餘額顯示
- `docker-compose.yml`、`Makefile`：本地 Postgres/Redis 與常用指令
- `deploy/railway.json`、`Procfile`：Railway 部署範本
- `docs/prizes/*`：黑客松簡報模板（Hardhat / PYUSD / Pyth）

若建立時未啟用商家模組，CLI 會自動刪除 `apps/web/src/modules/merchant`、`apps/api/src/modules/merchant` 與相關文件。

## 使用腳手架專案

### 🚀 一鍵開發（推薦）

最快的啟動方式只需一個指令：

```bash
cd my-makeabet-app
pnpm install
docker compose up -d    # 啟動 Postgres & Redis
pnpm dev
```

**背後發生的事情：**

1. **啟動 Hardhat 節點** - 本地區塊鏈運行於 `localhost:8545`
2. **等待埠號** - 確保 Hardhat 準備就緒後再繼續
3. **部署合約** - 部署 MockPYUSD 和 MakeABetMarket 合約
4. **同步環境變數** - 更新 `.env.local` 檔案，填入已部署的合約地址
5. **啟動所有服務** - 同時啟動 API（埠 4000）、Worker、Web（埠 5173）

您的本地開發環境現已完全配置並運行！

### 🔗 鏈切換

腳手架預設支援多個網路：

- **Local Hardhat** (31337) - 快速本地開發，交易即時確認
- **Sepolia** (11155111) - Ethereum 測試網，使用真實 PYUSD
- **Arbitrum Sepolia** (421614) - L2 測試網，手續費更低
- **Solana Devnet** - Solana 測試網，使用 SPL PYUSD

**切換鏈的步驟：**

1. 開啟網頁應用 `http://localhost:5173`
2. 點擊標題列的鏈選擇器
3. 選擇您想要的網路
4. 您的錢包會自動重新連接

UI 會根據所選鏈自動調整：
- 區塊瀏覽器連結自動更新
- PYUSD 合約地址依網路變更
- 水龍頭按鈕僅在本地 Hardhat 顯示

### 💧 本地水龍頭使用

當連接到本地 Hardhat 網路時，您可以即時領取測試代幣：

1. 將錢包連接到本地網路
2. 在錢包摘要中點擊 **「Request Faucet」** 按鈕
3. 立即收到 **1 ETH** 和 **100 PYUSD**
4. 餘額自動更新

**速率限制：** 每個地址每 5 分鐘可請求一次。

**水龍頭配置：**

您可以在 `.env` 中自訂水龍頭金額：

```bash
LOCAL_FAUCET_ETH_AMOUNT=1      # 每次請求的 ETH 數量
LOCAL_FAUCET_PYUSD_AMOUNT=100  # 每次請求的 PYUSD 數量
```

### 🔧 手動開發步驟

如果您偏好分別運行各項服務：

```bash
# 終端機 1：啟動 Hardhat 節點
pnpm chain

# 終端機 2：部署合約到本地鏈
pnpm deploy:local

# 終端機 3：同步環境變數
pnpm sync:local-env

# 終端機 4：啟動所有開發伺服器
pnpm --filter @makeabet/api dev
pnpm --filter @makeabet/worker dev
pnpm --filter @makeabet/web dev
```

### 🔨 Hardhat 3 指令

腳手架使用 **Hardhat 3.0.0+** 以符合 Hardhat Builders Challenge 資格：

```bash
# 編譯合約（Solidity 0.8.24+）
pnpm --filter @makeabet/contracts compile

# 執行 TypeScript 測試
pnpm --filter @makeabet/contracts test

# 執行 Solidity 測試（Hardhat 3 功能）
pnpm --filter @makeabet/contracts test:sol

# 部署到 Sepolia
pnpm --filter @makeabet/contracts run scripts/deploy.ts --network sepolia
```

**使用的 Hardhat 3 功能：**
- ✅ Solidity 測試（`.t.sol` 檔案）
- ✅ Rust 基礎效能改進
- ✅ 多鏈支援（EVM + Solana）
- ✅ 現代化 ethers v6 API
- ✅ 改進的 CLI 和插件系統

詳細的 Hardhat 3 文件請參閱 `apps/contracts/README.md`。

### 💵 PYUSD 整合

腳手架包含完整的 PYUSD 支援：

**本地開發：**
- 自動部署 Mock PYUSD ERC20 合約
- 6 位小數（與真實 PYUSD 相同）
- 水龍頭預載 1,000,000 PYUSD

**測試網地址：**
- **Sepolia：** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- **Arbitrum Sepolia：** `0xc6006A919685EA081697613373C50B6b46cd6F11`
- **Solana Devnet：** `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`

**使用範例：**

```typescript
// 檢查 PYUSD 餘額（React hook）
import { usePYUSDBalance } from '@/wallet/hooks';

const { balance, formatted, isLoading } = usePYUSDBalance(address);

// 轉帳 PYUSD（ethers v6）
const pyusd = new ethers.Contract(pyusdAddress, ERC20_ABI, signer);
await pyusd.transfer(recipient, ethers.parseUnits('100', 6));
```

更多詳情請參閱下方的 **PYUSD 整合指南** 章節。

### 🔮 Pyth Oracle 整合

腳手架展示 Pyth 的 pull oracle 模式：

**範例腳本：**
- `scripts/updatePrice.ts` - 從 Hermes 取得並更新鏈上價格
- `scripts/createRoom.ts` - 使用 Pyth 價格源建立預測市場
- `scripts/settleRoom.ts` - 使用 Pyth 價格結算市場

**Pull Oracle 流程：**

```typescript
// 1. 從 Hermes 取得價格資料
const priceIds = [process.env.PYTH_FEED_ID];
const response = await fetch(
  `${process.env.PYTH_PRICE_SERVICE_URL}/api/latest_price_feeds?ids[]=${priceIds[0]}`
);
const data = await response.json();

// 2. 更新鏈上價格
const updateData = data.binary.data.map(hex => '0x' + hex);
const fee = await pyth.getUpdateFee(updateData);
await pyth.updatePriceFeeds(updateData, { value: fee });

// 3. 消費價格
const price = await pyth.getPriceNoOlderThan(priceId, 60);
```

更多詳情請參閱下方的 **Pyth Oracle 指南** 章節。

### 📝 環境變數配置

複製 `.env.example` 為 `.env` 並填入必要的值：

**本地開發必填：**
```bash
# 資料庫（由 docker-compose 自動配置）
POSTGRES_URL=postgresql://makeabet:makeabet@localhost:5432/makeabet
REDIS_URL=redis://default:makeabet@localhost:6379

# 本地鏈（由 pnpm dev 自動配置）
LOCAL_CHAIN_ENABLED=true
LOCAL_RPC_URL=http://127.0.0.1:8545
```

**測試網/正式環境必填：**
```bash
# PayPal（從 developer.paypal.com 取得）
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret

# Pyth（使用預設值或自訂）
PYTH_PRICE_SERVICE_URL=https://hermes.pyth.network
PYTH_FEED_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace

# RPC URLs（使用公開或 Alchemy/Infura）
EVM_RPC_URL=https://ethereum-sepolia.publicnode.com
SOLANA_RPC_URL=https://api.devnet.solana.com

# PYUSD 地址（測試網已預先配置）
PYUSD_CONTRACT_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# WalletConnect（從 cloud.walletconnect.com 取得）
WALLETCONNECT_PROJECT_ID=your_project_id
```

**自動同步的變數：**

當您執行 `pnpm dev` 或 `pnpm sync:local-env` 時，這些變數會自動更新：
- `LOCAL_PYUSD_ADDRESS` - 已部署的 mock PYUSD 地址
- `LOCAL_MARKET_ADDRESS` - 已部署的市場合約地址
- `VITE_LOCAL_PYUSD_ADDRESS` - 前端的 PYUSD 地址副本

### ☁️ Railway 部署

幾分鐘內將專案部署到正式環境：

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/makeabet?referralCode=makeabet)

#### 部署內容

Railway 會自動配置：
- **Postgres 資料庫** - 儲存使用者資料、下注和市場資訊
- **Redis 實例** - 處理任務佇列和快取
- **API 服務** - Fastify 伺服器處理 HTTP 請求
- **Worker 服務** - 背景任務處理 Pyth 價格更新和市場結算

#### 必要的環境變數

點擊部署按鈕後，您需要在 Railway 中配置這些變數：

**必填：**
- `PAYPAL_CLIENT_ID` - 您的 PayPal REST API 客戶端 ID
- `PAYPAL_CLIENT_SECRET` - 您的 PayPal REST API 密鑰
- `TARGET_CHAIN` - 目標區塊鏈（例如 `sepolia`、`arbitrum-sepolia`、`solana-devnet`）
- `CHAIN_TYPE` - 鏈類型（`evm` 或 `solana`）
- `EVM_RPC_URL` - EVM 鏈的 RPC 端點（例如 Alchemy、Infura 或公開 RPC）
- `PYUSD_CONTRACT_ADDRESS` - 目標鏈的 PYUSD 代幣地址
- `MARKET_CONTRACT_ADDRESS` - 您已部署的 MakeABetMarket 合約地址
- `PYTH_FEED_ID` - 您市場的 Pyth 價格源 ID

**選填：**
- `PYTH_PRICE_SERVICE_URL` - 預設為 `https://hermes.pyth.network`
- `WALLETCONNECT_PROJECT_ID` - 用於 WalletConnect 支援
- `ENABLE_MERCHANT_PORTAL` - 設為 `true` 啟用商家功能
- `SOLANA_RPC_URL` - 使用 Solana 時必填
- `PYUSD_MINT_ADDRESS` - 使用 Solana 時必填

**Railway 自動注入：**
- `DATABASE_URL` / `POSTGRES_URL` - 由 Postgres 插件自動設定
- `REDIS_URL` - 由 Redis 插件自動設定
- `NODE_ENV` - 設為 `production`

#### 前端部署

前端（`apps/web`）應分別部署到靜態託管服務：

**選項 1：Vercel（推薦）**
1. 將您的 GitHub 儲存庫匯入 Vercel
2. 設定根目錄為 `apps/web`
3. 配置環境變數（參見 `apps/web/.env.example`）
4. 設定 `VITE_API_URL` 為您的 Railway API URL

**選項 2：Railway Static Site**
1. 在您的 Railway 專案中新增服務
2. 設定建置指令：`pnpm --filter @makeabet/web build`
3. 設定輸出目錄：`apps/web/dist`
4. 配置環境變數

**選項 3：Netlify**
1. 匯入您的 GitHub 儲存庫
2. 設定基礎目錄為 `apps/web`
3. 設定建置指令：`pnpm build`
4. 設定發布目錄：`dist`

#### 部署步驟

1. **先部署合約**
   ```bash
   # 部署到您的目標測試網（Sepolia、Arbitrum Sepolia 等）
   pnpm --filter @makeabet/contracts run scripts/deploy.ts --network sepolia
   ```
   儲存已部署的合約地址。

2. **點擊 Deploy on Railway**
   - 點擊上方的「Deploy on Railway」按鈕
   - 連接您的 GitHub 帳號
   - 選擇您的儲存庫
   - Railway 會讀取 `deploy/railway.json` 並配置服務

3. **配置環境變數**
   - 前往您的 Railway 專案設定
   - 新增上方列出的所有必要環境變數
   - 使用步驟 1 的合約地址

4. **部署前端**
   - 選擇您偏好的託管服務（Vercel/Netlify/Railway）
   - 配置前端環境變數
   - 設定 `VITE_API_URL` 為您的 Railway API URL（例如 `https://your-api.railway.app`）

5. **驗證部署**
   - 檢查 Railway 日誌中的 API 和 worker 服務
   - 測試 API 端點：`https://your-api.railway.app/api/config`
   - 開啟您的前端並測試完整流程

#### 疑難排解

**服務無法啟動：**
- 檢查 Railway 日誌中的錯誤訊息
- 驗證所有必要的環境變數已設定
- 確保 Postgres 和 Redis 插件正在運行

**資料庫連接錯誤：**
- 驗證 `DATABASE_URL` 已設定（應自動注入）
- 檢查 Postgres 插件狀態
- 嘗試重新啟動 API 服務

**Worker 未處理任務：**
- 檢查 Railway 中的 worker 日誌
- 驗證 `REDIS_URL` 設定正確
- 確保 Pyth 配置正確

**API 回傳 500 錯誤：**
- 檢查 API 日誌中的堆疊追蹤
- 驗證 RPC URL 可存取
- 測試合約地址正確

更多資訊請參閱：
- [Railway 部署指南](docs/RAILWAY_DEPLOYMENT.md) - 完整部署文件
- [Railway 測試檢查清單](docs/RAILWAY_TESTING_CHECKLIST.md) - 部署驗證清單
- [Railway 文件](https://docs.railway.app/) - Railway 官方文件
- 配置檔案：`deploy/railway.json`

**Railway 配置檔案：**

- `deploy/railway.json` - 定義服務和插件
- `Procfile` - 定義各服務的啟動指令
- `turbo.json` - 配置建置管線

## Hardhat 3 整合指南

此腳手架使用 **Hardhat 3.0.0+** 以符合 Hardhat Builders Challenge 獎項資格。

### 主要功能

**Solidity 測試：**
```solidity
// test/MakeABetMarket.t.sol
contract MakeABetMarketTest is Test {
    function testCreateRoom() public {
        // 使用 Hardhat 3 的原生 Solidity 測試
    }
}
```

**效能改進：**
- Rust 基礎編譯（更快的建置）
- 優化的測試執行
- 改進的快取

**多鏈支援：**
- 在 `hardhat.config.ts` 中配置多個網路
- 部署到 EVM 鏈和 Solana
- 網路特定配置

**現代化 API：**
- ethers v6 整合
- 改進的 TypeScript 支援
- 更好的錯誤訊息

### 執行測試

```bash
# TypeScript 測試
pnpm --filter @makeabet/contracts test

# Solidity 測試（Hardhat 3 功能）
pnpm --filter @makeabet/contracts test:sol

# 含覆蓋率
pnpm --filter @makeabet/contracts coverage
```

### 部署

```bash
# 本地
pnpm deploy:local

# Sepolia
pnpm --filter @makeabet/contracts run scripts/deploy.ts --network sepolia

# Arbitrum Sepolia
pnpm --filter @makeabet/contracts run scripts/deploy.ts --network arbitrumSepolia
```

完整的 Hardhat 3 文件請參閱 `apps/contracts/README.md`。

## PYUSD 整合指南

### 合約地址

**測試網：**
- **Ethereum Sepolia：** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- **Arbitrum Sepolia：** `0xc6006A919685EA081697613373C50B6b46cd6F11`
- **Solana Devnet：** `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`

**本地開發：**
- 透過 `pnpm dev` 自動部署 Mock PYUSD
- 地址儲存在 `LOCAL_PYUSD_ADDRESS` 環境變數中

### 檢查餘額

**前端（React）：**
```typescript
import { usePYUSDBalance } from '@/wallet/hooks';

function WalletDisplay() {
  const { address } = useAccount();
  const { balance, formatted, isLoading, error } = usePYUSDBalance(address);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Text>載入餘額時發生錯誤</Text>;
  
  return <Text>{formatted} PYUSD</Text>;
}
```

**後端（Node.js）：**
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);
const pyusd = new ethers.Contract(
  process.env.PYUSD_CONTRACT_ADDRESS,
  ['function balanceOf(address) view returns (uint256)'],
  provider
);

const balance = await pyusd.balanceOf(address);
const formatted = ethers.formatUnits(balance, 6); // PYUSD 有 6 位小數
```

### 轉帳 PYUSD

**前端：**
```typescript
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';

const { writeContract } = useWriteContract();

await writeContract({
  address: pyusdAddress,
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: [recipient, parseUnits('100', 6)], // 100 PYUSD
});
```

**智能合約：**
```solidity
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyContract {
    IERC20 public pyusd;
    
    constructor(address _pyusd) {
        pyusd = IERC20(_pyusd);
    }
    
    function acceptPayment(uint256 amount) external {
        pyusd.transferFrom(msg.sender, address(this), amount);
    }
}
```

### 授權

在合約可以代表您轉帳 PYUSD 之前，您必須先授權：

```typescript
// 前端
await writeContract({
  address: pyusdAddress,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [contractAddress, parseUnits('1000', 6)], // 授權 1000 PYUSD
});

// 然後呼叫合約函式
await writeContract({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'acceptPayment',
  args: [parseUnits('100', 6)],
});
```

## Pyth Oracle 指南

此腳手架展示 Pyth 的 **pull oracle 模式** 用於鏈上價格源。

### Pull Oracle 模式

與傳統的 push oracle 不同，Pyth 使用 pull 模型：

1. **取得** 從 Hermes API 取得價格資料（鏈下）
2. **更新** 透過提交資料更新鏈上價格
3. **消費** 在您的合約中消費更新後的價格

這種方法更節省 gas 並提供更新鮮的資料。

### 從 Hermes 取得

```typescript
// 取得最新價格更新
const priceIds = [
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' // ETH/USD
];

const response = await fetch(
  `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceIds[0]}`
);

const data = await response.json();
const updateData = data.binary.data.map(hex => '0x' + hex);
```

### 更新鏈上

```typescript
import { ethers } from 'ethers';

const pyth = new ethers.Contract(pythAddress, PYTH_ABI, signer);

// 取得更新費用
const fee = await pyth.getUpdateFee(updateData);

// 更新價格源
const tx = await pyth.updatePriceFeeds(updateData, { value: fee });
await tx.wait();
```

### 消費價格

**在智能合約中：**
```solidity
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract MyContract {
    IPyth pyth;
    bytes32 ethUsdPriceId;
    
    constructor(address _pyth, bytes32 _priceId) {
        pyth = IPyth(_pyth);
        ethUsdPriceId = _priceId;
    }
    
    function getLatestPrice() public view returns (int64) {
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            ethUsdPriceId,
            60 // 最大年齡：60 秒
        );
        return price.price;
    }
    
    function updateAndGetPrice(bytes[] calldata updateData) 
        external 
        payable 
        returns (int64) 
    {
        // 更新價格（需要費用）
        uint fee = pyth.getUpdateFee(updateData);
        pyth.updatePriceFeeds{value: fee}(updateData);
        
        // 取得更新後的價格
        PythStructs.Price memory price = pyth.getPrice(ethUsdPriceId);
        return price.price;
    }
}
```

**在前端：**
```typescript
// 讀取價格（無需交易）
const price = await pythContract.getPriceNoOlderThan(priceId, 60);
console.log('價格:', price.price);
console.log('信心區間:', price.conf);
console.log('指數:', price.expo);

// 計算人類可讀的價格
const humanPrice = Number(price.price) * Math.pow(10, price.expo);
```

### 價格源 ID

黑客松常用的價格源：

- **ETH/USD：** `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **BTC/USD：** `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **SOL/USD：** `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`

更多請參閱：https://pyth.network/developers/price-feed-ids

### 範例腳本

腳手架包含可運作的範例：

```bash
# 在本地鏈上更新 ETH/USD 價格
pnpm --filter @makeabet/contracts run scripts/updatePrice.ts

# 使用 Pyth 源建立預測市場
pnpm --filter @makeabet/contracts run scripts/createRoom.ts

# 使用 Pyth 價格結算市場
pnpm --filter @makeabet/contracts run scripts/settleRoom.ts
```

## 開發注意事項

- CLI 原始碼在 `packages/create-makeabet`，可用 `pnpm --filter @makeabet/create dev` 進入 watch 模式。
- 模板在 `templates/monorepo/`，調整內容後再重建 CLI。
- 隨著 MakeABet 專案演進，記得同步更新腳手架的模板與文檔。

## 獎項資格檢查清單

### ✅ Hardhat Builders Challenge

- [x] 使用 Hardhat 3.0.0+
- [x] 包含 Solidity 測試（`.t.sol` 檔案）
- [x] 展示 Hardhat 3 功能
- [x] 在 README 中記錄

### ✅ PayPal USD 獎項

- [x] 整合 PYUSD 代幣
- [x] 支援多鏈（Sepolia、Arbitrum、Solana）
- [x] 包含餘額檢查和轉帳
- [x] 附有程式碼範例文件

### ✅ Pyth Network 獎項

- [x] 使用 pull oracle 模式
- [x] 從 Hermes API 取得
- [x] 更新鏈上價格
- [x] 在合約中消費價格
- [x] 附有範例文件

## 資源

- **Hardhat 3 文件：** https://hardhat.org/docs/getting-started
- **PYUSD 開發者資源：** https://linktr.ee/pyusd_dev
- **Pyth EVM 指南：** https://docs.pyth.network/price-feeds/use-real-time-data/evm
- **Pyth 價格源：** https://pyth.network/developers/price-feed-ids
- **Railway 文件：** https://docs.railway.app

## 支援

如有問題或疑問：
- 在 GitHub 上開啟 issue
- 查看 `docs/` 中的詳細指南
- 檢閱 `apps/contracts/scripts/` 中的範例腳本

## 授權

MIT
