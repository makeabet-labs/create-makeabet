# 完整測試指南

## ✅ 已解決的問題

### 1. API Faucet 404 錯誤 - ✅ 已修復
- **原因**: `LOCAL_CHAIN_ENABLED` 環境變量未正確設置
- **解決方案**: 在 `apps/api/.env.local` 中設置 `LOCAL_CHAIN_ENABLED=true`
- **驗證**: Faucet 端點現在返回 200/500 而不是 404

### 2. 前端 Wallet Context 錯誤 - ✅ 已修復
- **原因**: Solana wallet adapter 在 WalletProvider 初始化前被訪問
- **解決方案**: 完全移除 Solana 支援，簡化為 EVM-only
- **驗證**: 不再有 "publicKey on WalletContext without providing one" 錯誤

### 3. PYUSD Balance 載入錯誤 - ✅ 已修復
- **原因**: Solana 相關的 balance hooks 導致錯誤
- **解決方案**: 簡化 hooks 只使用 EVM/Wagmi
- **驗證**: Balance hooks 現在只查詢 EVM 鏈

## 完整測試流程

### 步驟 1: 啟動 Hardhat 本地節點

```bash
cd templates/monorepo
pnpm chain
```

**預期輸出**:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

保持這個終端運行。

### 步驟 2: 部署合約

在新終端中：

```bash
cd templates/monorepo
pnpm deploy:local
```

**預期輸出**:
```
Deploying PYUSD...
PYUSD deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Deploying Market...
Market deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

記下這些地址，確保它們與 `.env.local` 中的匹配。

### 步驟 3: 啟動 API 服務器

在新終端中：

```bash
cd templates/monorepo/apps/api
pnpm dev
```

**預期輸出**:
```
{"level":30,"time":...,"msg":"Server listening at http://0.0.0.0:4000"}
```

### 步驟 4: 測試 API Faucet 端點

在新終端中：

```bash
cd templates/monorepo
./test-api-faucet.sh
```

**預期輸出**:
```
✅ Health check passed
✅ Config endpoint accessible
✅ Local chain is enabled
✅ Faucet endpoint is registered
```

### 步驟 5: 啟動前端

在新終端中：

```bash
cd templates/monorepo/apps/web
pnpm dev
```

**預期輸出**:
```
VITE v6.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 步驟 6: 配置 MetaMask

1. 打開 MetaMask
2. 添加網絡：
   - **Network Name**: Localhost 8545
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

3. 導入測試帳戶（可選）：
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - 這是 Hardhat 的第一個測試帳戶，有 10000 ETH

### 步驟 7: 測試前端

1. 打開瀏覽器訪問 http://localhost:5173
2. 點擊 "Get Started" 進入 `/app`
3. 點擊右上角的 "Connect Wallet"
4. 選擇 MetaMask 並連接
5. 確認切換到 Localhost 8545 網絡
6. 應該看到：
   - 錢包地址顯示
   - ETH 餘額顯示
   - PYUSD 餘額顯示（可能是 0.00）
7. 點擊 "領取本地測試資產" 按鈕
8. 確認 MetaMask 交易（兩筆：ETH 和 PYUSD）

**預期結果**:
- ✅ 收到 1 ETH
- ✅ 收到 100 PYUSD
- ✅ 餘額自動更新
- ✅ 顯示交易哈希

## 常見問題排查

### 問題 1: Faucet 返回 404

**症狀**: 
```json
{"message": "Route POST:/faucet not found","error": "Not Found","statusCode": 404}
```

**解決方案**:
1. 檢查 `apps/api/.env.local` 是否有 `LOCAL_CHAIN_ENABLED=true`
2. 重啟 API 服務器
3. 運行 `./test-api-faucet.sh` 驗證

### 問題 2: Faucet 返回 "busy processing"

**症狀**:
```json
{"ok": false,"error": "Faucet is busy processing another request. Please retry in a few seconds."}
```

**原因**: Nonce 衝突或前一個交易還在處理中

**解決方案**:
1. 等待 5-10 秒後重試
2. 如果持續發生，重啟 Hardhat 節點
3. 重新部署合約

### 問題 3: 前端顯示 "Error loading balance"

**症狀**: PYUSD 或 ETH 餘額顯示錯誤

**解決方案**:
1. 確認 MetaMask 連接到正確的網絡（Chain ID: 31337）
2. 確認合約地址正確
3. 打開瀏覽器 Console 查看詳細錯誤
4. 嘗試刷新頁面

### 問題 4: MetaMask 交易失敗

**症狀**: 交易被拒絕或失敗

**解決方案**:
1. 重置 MetaMask 帳戶：Settings > Advanced > Reset Account
2. 確認 Hardhat 節點正在運行
3. 確認有足夠的 ETH 支付 gas

### 問題 5: 合約地址不匹配

**症狀**: 部署的合約地址與 `.env.local` 不同

**解決方案**:
1. 更新 `apps/api/.env.local` 中的地址
2. 更新 `apps/web/.env.local` 中的地址（如果有）
3. 重啟 API 和前端服務器

## 驗證清單

使用這個清單確保所有功能正常：

- [ ] Hardhat 節點運行在 http://127.0.0.1:8545
- [ ] 合約已部署並記錄地址
- [ ] API 運行在 http://localhost:4000
- [ ] API health check 返回 `{"status":"ok"}`
- [ ] API config 顯示 `"localChainEnabled":true`
- [ ] API faucet 端點不返回 404
- [ ] 前端運行在 http://localhost:5173
- [ ] MetaMask 連接到 Localhost 8545 (Chain ID: 31337)
- [ ] 前端可以連接錢包
- [ ] 前端顯示 ETH 餘額
- [ ] 前端顯示 PYUSD 餘額
- [ ] Faucet 按鈕可點擊
- [ ] Faucet 成功發送 ETH 和 PYUSD
- [ ] 餘額自動更新

## 成功標準

當以下所有條件都滿足時，系統運作正常：

1. ✅ API faucet 端點返回 200 或 500（不是 404）
2. ✅ 前端無 wallet context 錯誤
3. ✅ 可以連接 MetaMask
4. ✅ 可以查看餘額
5. ✅ 可以使用 faucet 領取測試資產
6. ✅ 餘額正確更新

## 下一步

系統正常運作後，你可以：

1. 開發自定義合約功能
2. 整合 Pyth Price Feeds
3. 實現投注邏輯
4. 添加更多 UI 功能
5. 部署到測試網（Sepolia 或 Arbitrum Sepolia）
