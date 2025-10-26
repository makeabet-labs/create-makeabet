# Faucet 故障排除指南

## 當前狀態

✅ **API 端點存在** - `/api/faucet` 可以訪問（不是 404）  
✅ **配置正確** - `LOCAL_CHAIN_ENABLED=true`  
✅ **Hardhat 運行中** - RPC 響應正常  
⚠️ **Nonce 錯誤** - 返回 "Faucet is busy processing another request"

## 問題診斷

錯誤訊息 "Faucet is busy processing another request" 來自 API 的錯誤處理，當 ethers.js 拋出包含 "nonce" 的錯誤時觸發。

可能的原因：
1. 之前的交易還在處理中（pending）
2. Ethers.js 的 nonce 管理出現問題
3. Hardhat 節點狀態不一致

## 解決方案

### 方案 1: 重啟所有服務（推薦）

這是最可靠的方法：

```bash
# 1. 停止所有服務 (Ctrl+C)

# 2. 重啟 Hardhat
pnpm chain

# 3. 在新終端重新部署合約
pnpm deploy:local

# 4. 在新終端啟動 API
cd apps/api
pnpm dev

# 5. 在新終端啟動前端
cd apps/web
pnpm dev
```

### 方案 2: 只重啟 Hardhat 和 API

如果前端正常，只需重啟後端：

```bash
# 1. 停止 Hardhat (Ctrl+C)
# 2. 停止 API (Ctrl+C)

# 3. 重啟 Hardhat
pnpm chain

# 4. 重新部署
pnpm deploy:local

# 5. 重啟 API
cd apps/api
pnpm dev
```

### 方案 3: 修改 API 代碼添加 nonce 管理

如果問題持續，可以修改 `apps/api/src/router.ts` 添加顯式的 nonce 管理：

```typescript
// 在 faucet 路由中，發送交易前獲取 nonce
const nonce = await provider.getTransactionCount(wallet.address, 'latest');

// 發送 ETH 時指定 nonce
const ethTx = await wallet.sendTransaction({ 
  to: recipient, 
  value: ethAmount,
  nonce: nonce  // 顯式指定
});

// 等待確認
await ethTx.wait();

// PYUSD 交易使用 nonce + 1
const tokenTx = await erc20.transfer(recipient, pyusdAmount, {
  nonce: nonce + 1
});
```

### 方案 4: 添加互斥鎖

在 `apps/api/src/router.ts` 中添加全局鎖：

```typescript
// 在文件頂部添加
let faucetLock = false;

// 在 faucet 路由開始處添加
if (faucetLock) {
  reply.code(429);
  return { 
    ok: false, 
    error: 'Faucet is currently processing another request. Please wait.' 
  };
}

faucetLock = true;

try {
  // ... 現有的 faucet 邏輯 ...
} finally {
  faucetLock = false;
}
```

## 測試步驟

重啟後，按以下步驟測試：

### 1. 驗證 Hardhat

```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

應該返回：`{"jsonrpc":"2.0","id":1,"result":"0x..."}`

### 2. 驗證 API

```bash
curl http://localhost:4000/api/health
```

應該返回：`{"status":"ok"}`

### 3. 檢查配置

```bash
curl http://localhost:4000/api/config | jq '.localChainEnabled'
```

應該返回：`true`

### 4. 測試 Faucet

```bash
curl -X POST http://localhost:4000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}'
```

**成功響應**：
```json
{
  "ok": true,
  "transactions": ["0x...", "0x..."]
}
```

**如果還是失敗**，查看 API 終端的日誌，應該會看到詳細的錯誤信息。

## 前端測試

1. 打開 http://localhost:5173
2. 點擊 "Get Started"
3. 連接 MetaMask 到 Localhost 8545
4. 點擊 "領取本地測試資產"

**注意**：前端會調用 `/api/faucet`，不是 `/faucet`

## 常見錯誤

### 錯誤 1: 404 Not Found

```json
{"message": "Route POST:/faucet not found"}
```

**原因**：訪問了錯誤的端點  
**解決**：使用 `/api/faucet` 而不是 `/faucet`

### 錯誤 2: Nonce too low

**原因**：Hardhat 節點重啟但 API 沒有重啟  
**解決**：重啟 API 服務器

### 錯誤 3: Insufficient funds

**原因**：Faucet 錢包餘額不足  
**解決**：重啟 Hardhat 節點（會重置所有餘額）

### 錯誤 4: Network error

**原因**：Hardhat 沒有運行或 RPC URL 錯誤  
**解決**：
1. 確認 Hardhat 運行在 http://127.0.0.1:8545
2. 檢查 `apps/api/.env.local` 中的 `LOCAL_RPC_URL`

## 檢查清單

在報告問題前，請確認：

- [ ] Hardhat 節點正在運行
- [ ] 合約已部署
- [ ] API 服務器正在運行
- [ ] `LOCAL_CHAIN_ENABLED=true` 在 `apps/api/.env.local`
- [ ] 使用正確的端點 `/api/faucet`
- [ ] Faucet 錢包有足夠餘額
- [ ] 沒有其他 faucet 請求正在處理

## 獲取幫助

如果問題持續，請提供：

1. API 終端的完整日誌
2. Hardhat 終端的輸出
3. 瀏覽器 Console 的錯誤（如果使用前端）
4. 使用的 curl 命令和完整響應
5. `apps/api/.env.local` 的內容（隱藏敏感信息）
