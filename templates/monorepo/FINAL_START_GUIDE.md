# 🚀 最終啟動指南

## 所有問題已修復

✅ 移除了所有 Solana 代碼  
✅ 修復了 API 調用路徑  
✅ 重新創建了必需的 eventemitter3 wrapper  
✅ 更新了 Vite 配置  
✅ 停止了佔用端口的舊進程

## 立即執行

```bash
cd templates/monorepo

# 啟動所有服務
pnpm dev
```

## 等待啟動

你會看到以下輸出（約 10-20 秒）：

```
[0] Started HTTP and WebSocket JSON-RPC server at http://0.0.0.0:8545/
[1] Deploying contracts...
[1] MockPYUSD deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[1] MakeABetMarket deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
[1] @makeabet/api:dev: Server listening at http://127.0.0.1:4000
[1] @makeabet/web:dev: Local: http://localhost:5173/
```

## 測試步驟

### 1. 打開瀏覽器

訪問 http://localhost:5173

**重要**: 按 **Cmd+Shift+R** (Mac) 或 **Ctrl+Shift+R** (Windows/Linux) 硬刷新

### 2. 檢查 Console

按 F12 打開開發者工具，查看 Console 標籤：

**應該沒有錯誤**：
- ✅ 無 "publicKey" 錯誤
- ✅ 無 "@solana/wallet-adapter" 錯誤
- ✅ 無 "eventemitter3" 錯誤

### 3. 連接錢包

1. 點擊右上角 "Connect Wallet"
2. 選擇 MetaMask
3. 確認連接到 **Localhost 8545** (Chain ID: 31337)

### 4. 檢查 Wallet Summary

應該顯示：
- ✅ 你的錢包地址
- ✅ ETH Balance（數字，不是錯誤）
- ✅ PYUSD Balance（數字，可能是 0.00）

### 5. 測試 Faucet

點擊 "Request Faucet" 或 "領取本地測試資產"

**檢查 Network 標籤**（F12 → Network）：
- ✅ URL: `http://localhost:4000/api/faucet`
- ✅ Method: POST
- ✅ Status: 200 (成功) 或 500（但不是 404）

**應該收到**：
- ✅ 成功通知："Sent test tokens to your wallet"
- ✅ 或明確的錯誤信息（不是 404）

### 6. 驗證餘額

成功後，餘額應該更新：
- ✅ ETH Balance 增加 1 ETH
- ✅ PYUSD Balance 增加 100 PYUSD

## 成功標準

當你看到以下所有情況時，系統正常運作：

1. ✅ 所有服務啟動無錯誤
2. ✅ 瀏覽器 Console 無錯誤
3. ✅ 可以連接 MetaMask
4. ✅ Wallet Summary 正常顯示
5. ✅ Faucet 調用正確的 API
6. ✅ 可以成功領取測試資產
7. ✅ 餘額正確更新

## 如果遇到問題

### 問題 A: 端口被佔用

```bash
# 停止佔用 8545 的進程
lsof -ti:8545 | xargs kill -9

# 停止佔用 4000 的進程
lsof -ti:4000 | xargs kill -9

# 重新啟動
pnpm dev
```

### 問題 B: 瀏覽器還是有錯誤

1. 使用無痕模式
2. 或者清理所有緩存：
   ```bash
   # 在瀏覽器中
   # 開發者工具 → Application → Clear storage → Clear site data
   ```

### 問題 C: Faucet 返回 "busy processing"

等待 10 秒後重試，或者重啟所有服務。

### 問題 D: 合約地址不匹配

```bash
# 檢查部署的地址
cat apps/contracts/deployments/local.json

# 檢查環境變量
grep PYUSD apps/api/.env.local
grep PYUSD apps/web/.env.local
```

確保所有地址一致。

## 快速測試命令

在新終端中運行：

```bash
cd templates/monorepo

# 測試 Hardhat
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 測試 API
curl http://localhost:4000/api/health

# 測試 Faucet
curl -X POST http://localhost:4000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}'
```

## 下一步

系統正常運作後，你可以：

1. 開發自定義合約功能
2. 整合 Pyth Price Feeds
3. 實現投注邏輯
4. 添加更多 UI 功能
5. 部署到測試網（Sepolia 或 Arbitrum Sepolia）

## 常用命令

```bash
# 啟動開發環境
pnpm dev

# 清理緩存
pnpm clean

# 只啟動 Hardhat
pnpm chain

# 只部署合約
pnpm deploy:local

# 運行測試
pnpm test

# 構建生產版本
pnpm build
```

## 需要幫助？

如果問題持續，請提供：

1. 完整的終端輸出
2. 瀏覽器 Console 的截圖
3. Network 標籤的請求詳情
4. 運行 `./diagnose-faucet.sh` 的輸出

---

**現在執行 `pnpm dev`，一切應該都能正常工作了！** 🎉
