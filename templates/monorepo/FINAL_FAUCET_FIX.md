# Faucet 最終修復指南

## 當前狀態

✅ **所有配置正確**
- API 端點已註冊（`/api/faucet`）
- `LOCAL_CHAIN_ENABLED=true`
- Faucet 錢包有充足餘額（9.22 ETH, 1M PYUSD）
- 部署成功，合約地址正確

⚠️ **問題**: 返回 500 錯誤 "Faucet is busy processing another request"

## 診斷步驟

### 1. 查看 API 詳細日誌

我已經更新了 API 代碼來輸出更詳細的錯誤。請：

1. 停止當前的 `pnpm dev` (Ctrl+C)
2. 重新啟動：
   ```bash
   pnpm dev
   ```
3. 等待所有服務啟動
4. 測試 faucet：
   ```bash
   curl -X POST http://localhost:4000/api/faucet \
     -H "Content-Type: application/json" \
     -d '{"address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}'
   ```
5. **查看 API 終端的日誌**，應該會看到類似：
   ```json
   {"level":50,"err":{...},"fullErrorMessage":"...","msg":"Full error details"}
   ```

請把完整的錯誤信息貼給我。

### 2. 可能的原因和解決方案

#### 原因 A: Ethers.js Nonce 管理問題

**症狀**: 錯誤信息包含 "nonce too low" 或 "replacement transaction underpriced"

**解決方案**: 在 `apps/api/src/router.ts` 的 faucet 路由中添加顯式 nonce 管理：

```typescript
// 在發送交易前獲取 nonce
const currentNonce = await provider.getTransactionCount(wallet.address, 'latest');
app.log.info({ currentNonce }, 'Current nonce');

// 發送 ETH 時指定 nonce
const ethTx = await wallet.sendTransaction({ 
  to: recipient, 
  value: ethAmount,
  nonce: currentNonce  // 顯式指定
});

await ethTx.wait();

// PYUSD 交易使用下一個 nonce
if (pyusdAddress) {
  const erc20 = new ethers.Contract(pyusdAddress, faucetAbi, wallet);
  const pyusdAmount = ethers.parseUnits(process.env.LOCAL_FAUCET_PYUSD_AMOUNT ?? '100', 6);
  const tokenTx = await erc20.transfer(recipient, pyusdAmount, {
    nonce: currentNonce + 1  // 使用下一個 nonce
  });
  await tokenTx.wait();
}
```

#### 原因 B: 並發請求衝突

**症狀**: 多個請求同時進來導致 nonce 衝突

**解決方案**: 添加互斥鎖（已在代碼中實現 rate limiter，但可以加強）：

```typescript
// 在 registerRoutes 函數頂部添加
let faucetProcessing = false;

// 在 faucet 路由開始處添加
if (faucetProcessing) {
  reply.code(429);
  return { 
    ok: false, 
    error: 'Faucet is currently processing another request. Please wait.' 
  };
}

faucetProcessing = true;

try {
  // ... 現有的 faucet 邏輯 ...
} finally {
  faucetProcessing = false;
}
```

#### 原因 C: Provider 連接問題

**症狀**: 錯誤信息包含 "could not detect network" 或 "connection refused"

**解決方案**: 
1. 確認 Hardhat 正在運行
2. 檢查 `LOCAL_RPC_URL` 是否正確
3. 嘗試重啟 Hardhat

## 快速測試腳本

使用診斷腳本：

```bash
./diagnose-faucet.sh
```

這會檢查：
- 部署狀態
- 環境變量
- Faucet 餘額
- API 配置
- 端點可用性

## 如果問題持續

請提供以下信息：

1. **API 日誌中的完整錯誤信息**（包括 `fullErrorMessage`）
2. **Hardhat 終端的輸出**（看是否有交易記錄）
3. **運行診斷腳本的輸出**：
   ```bash
   ./diagnose-faucet.sh > faucet-diagnosis.txt 2>&1
   ```

## 臨時解決方案

如果需要立即測試其他功能，可以：

1. 使用 Hardhat 的測試帳戶直接發送：
   ```bash
   # 使用 Hardhat console
   pnpm --filter @makeabet/contracts exec hardhat console --network localhost
   ```
   
   然後在 console 中：
   ```javascript
   const [deployer] = await ethers.getSigners();
   await deployer.sendTransaction({
     to: "YOUR_ADDRESS",
     value: ethers.parseEther("1")
   });
   ```

2. 或者暫時跳過 faucet，使用 Hardhat 預設帳戶（已經有 10000 ETH）

## 下一步

一旦我們看到完整的錯誤信息，我可以提供精確的修復方案。
