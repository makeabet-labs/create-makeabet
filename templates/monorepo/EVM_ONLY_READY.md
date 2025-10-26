# ✅ EVM-Only Configuration Complete

## 已完成的修改

### 1. 移除 Solana 支援
- ✅ 從 `chains.ts` 移除 `solana-devnet` 配置
- ✅ 簡化 `ChainMetadata` 接口，只支援 `'evm'` 類型
- ✅ 移除所有 `@solana/wallet-adapter` 和 `@solana/web3.js` 的引用

### 2. 簡化核心組件
- ✅ **WalletProvider**: 只使用 RainbowKit + Wagmi
- ✅ **App.tsx**: 移除 Solana wallet hooks
- ✅ **WalletSummary**: 只使用 EVM address
- ✅ **ChainSwitcher**: 移除 Solana 選項
- ✅ **wallet/hooks.ts**: 只保留 EVM balance 邏輯

### 3. Wagmi 配置
- ✅ 創建 `src/config/wagmi.ts`
- ✅ 配置支援的鏈: Local Hardhat, Sepolia, Arbitrum Sepolia
- ✅ 配置 WalletConnect 和 injected connectors
- ✅ 刪除舊的 `wallet/config.ts`

### 4. TypeScript 編譯
- ✅ 修復所有 wagmi 相關的類型錯誤
- ✅ 修復 ConnectButton props
- ✅ 核心文件無 TypeScript 錯誤

## 測試步驟

### 1. 啟動本地 Hardhat 節點
```bash
cd templates/monorepo
pnpm chain
```

### 2. 部署合約
```bash
pnpm deploy:local
```

### 3. 啟動 API 服務器
```bash
cd apps/api
pnpm dev
```
確保 `.env.local` 中有 `LOCAL_CHAIN_ENABLED=true`

### 4. 啟動前端
```bash
cd apps/web
pnpm dev
```

### 5. 測試 Faucet
1. 在瀏覽器打開 http://localhost:5173
2. 點擊 "Get Started" 進入 /app
3. 連接 MetaMask 到 localhost:8545 (Chain ID: 31337)
4. 點擊 "領取本地測試資產"
5. 應該收到 1 ETH 和 100 PYUSD

## API 配置檢查

確保 `apps/api/.env.local` 包含：
```env
LOCAL_CHAIN_ENABLED=true
LOCAL_CHAIN_ID=31337
LOCAL_RPC_URL=http://127.0.0.1:8545
LOCAL_PYUSD_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
LOCAL_FAUCET_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

## 已知問題

以下文件有 TypeScript 錯誤，但不影響核心 EVM 功能：
- `BettingExperience.tsx` - Mantine NumberInput API 變更
- `LiveMarketList.tsx` - participants 可選類型
- `LandingPage.tsx` - Mantine 組件 API 變更

這些是 UI 組件的小問題，不影響錢包連接和 faucet 功能。

## 下一步

如果一切正常運作，可以選擇性地：
1. 從 `package.json` 移除 Solana 依賴以減小 bundle size
2. 移除 `buffer` polyfill（不再需要）
3. 更新其他 UI 組件以修復剩餘的 TypeScript 錯誤

## 故障排除

### Faucet 404 錯誤
- 確認 API 的 `.env.local` 有 `LOCAL_CHAIN_ENABLED=true`
- 重啟 API 服務器

### 錢包連接錯誤
- 確認 MetaMask 連接到 localhost:8545
- 確認 Chain ID 是 31337
- 嘗試重置 MetaMask 帳戶（Settings > Advanced > Reset Account）

### Balance 顯示錯誤
- 確認合約已正確部署
- 檢查 console 是否有錯誤訊息
- 確認 PYUSD 合約地址正確
