# ⚡ 立即執行 - 修復所有問題

## 問題總結

你遇到的所有問題都源於：
1. **舊的編譯文件（.js）還包含 Solana 代碼**
2. **前端 API 調用使用相對路徑**
3. **瀏覽器緩存舊代碼**

## 已完成的修復

✅ 刪除了包含 Solana 代碼的 `apps/web/src/wallet/hooks.js`  
✅ 修改了 `App.tsx` 使用完整 API URL  
✅ 添加了清理腳本到 `package.json`  
✅ 移除了所有 Solana 相關代碼

## 🚀 立即執行這些步驟

### 步驟 1: 停止當前服務

在運行 `pnpm dev` 的終端按 **Ctrl+C**

### 步驟 2: 清理所有緩存

```bash
cd templates/monorepo

# 使用新的清理命令
pnpm clean
```

這會清理：
- Turbo 緩存
- Vite 緩存
- 所有構建產物

### 步驟 3: 重新啟動

```bash
pnpm dev
```

等待所有服務啟動（約 10-20 秒），你應該看到：
```
[0] Hardhat 啟動...
[1] 部署合約...
[1] @makeabet/api:dev: Server listening at http://127.0.0.1:4000
[1] @makeabet/web:dev: Local: http://localhost:5173/
```

### 步驟 4: 清理瀏覽器緩存

**非常重要！**

#### 選項 A: 硬刷新（推薦）

1. 打開 http://localhost:5173
2. 按 **Cmd+Shift+R** (Mac) 或 **Ctrl+Shift+R** (Windows/Linux)
3. 或者：
   - 打開開發者工具 (F12)
   - 右鍵點擊刷新按鈕
   - 選擇 "清空緩存並硬性重新載入"

#### 選項 B: 無痕模式（最可靠）

1. 打開瀏覽器的無痕/隱私模式
2. 訪問 http://localhost:5173
3. 測試功能

### 步驟 5: 測試功能

1. **連接錢包**：
   - 點擊右上角 "Connect Wallet"
   - 選擇 MetaMask
   - 確認連接到 Localhost 8545 (Chain ID: 31337)

2. **檢查 Console**：
   - 按 F12 打開開發者工具
   - 查看 Console 標籤
   - **應該沒有任何錯誤**

3. **檢查 Wallet Summary**：
   - 應該顯示你的地址
   - ETH Balance 應該顯示數字（不是 "Error loading balance"）
   - PYUSD Balance 應該顯示數字（可能是 0.00）

4. **測試 Faucet**：
   - 點擊 "Request Faucet" 或 "領取本地測試資產"
   - 檢查 Network 標籤，應該看到：
     - URL: `http://localhost:4000/api/faucet`
     - Method: POST
     - Status: 200 (成功) 或 500 (服務器錯誤，但不是 404)
   - 應該收到成功通知或明確的錯誤信息

## ✅ 成功標準

當一切正常時，你應該看到：

### Console (F12 → Console)
- ✅ 無 "publicKey" 錯誤
- ✅ 無 "@solana/wallet-adapter" 錯誤
- ✅ 無 "WalletContext" 錯誤

### Network (F12 → Network)
- ✅ Faucet 請求到 `http://localhost:4000/api/faucet`
- ✅ 不是 `http://localhost:5173/api/faucet`
- ✅ 不是 `http://localhost:4000/faucet`

### 功能
- ✅ 可以連接 MetaMask
- ✅ Wallet Summary 正常顯示
- ✅ ETH Balance 顯示數字
- ✅ PYUSD Balance 顯示數字
- ✅ Faucet 按鈕可點擊
- ✅ 點擊後收到通知

## 🔍 如果還有問題

### 問題 A: 還是看到 "publicKey" 錯誤

**解決方案**：
```bash
# 檢查是否還有 .js 文件
find apps/web/src -name "*.js" ! -path "*/node_modules/*" ! -path "*/test/*"

# 如果有，刪除它們
find apps/web/src -name "*.js" ! -path "*/node_modules/*" ! -path "*/test/*" -delete

# 重新啟動
pnpm dev
```

然後在瀏覽器中硬刷新。

### 問題 B: Faucet 還是 404

**檢查**：
1. 打開 F12 → Network
2. 點擊 Faucet 按鈕
3. 查看請求的 URL

如果 URL 是 `http://localhost:5173/api/faucet`：
- 瀏覽器還在使用舊代碼
- 嘗試無痕模式

如果 URL 是 `http://localhost:4000/faucet`（缺少 /api）：
- 前端代碼沒有更新
- 運行 `pnpm clean` 然後 `pnpm dev`

### 問題 C: PYUSD Balance 顯示錯誤

**可能原因**：
1. 合約地址不正確
2. 錢包沒有 PYUSD

**檢查**：
```bash
# 查看部署的合約地址
cat apps/contracts/deployments/local.json

# 查看 API 環境變量
grep PYUSD apps/api/.env.local

# 查看 Web 環境變量
grep PYUSD apps/web/.env.local
```

確保所有地址一致。

### 問題 D: Faucet 返回 "busy processing"

**解決方案**：
1. 等待 10 秒後重試
2. 或者重啟所有服務：
   ```bash
   # Ctrl+C 停止
   pnpm dev
   ```

## 📝 快速測試命令

在新終端中運行這些命令來驗證：

```bash
cd templates/monorepo

# 測試 Hardhat
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 測試 API Health
curl http://localhost:4000/api/health

# 測試 API Config
curl http://localhost:4000/api/config | jq '.localChainEnabled'

# 測試 Faucet
curl -X POST http://localhost:4000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}'
```

**預期結果**：
- Hardhat: 返回 block number
- Health: `{"status":"ok"}`
- Config: `true`
- Faucet: JSON 響應（不是 404）

## 🎉 完成後

一旦所有測試通過，你就可以：

1. 開始開發自定義功能
2. 整合 Pyth Price Feeds
3. 實現投注邏輯
4. 部署到測試網

## 需要更多幫助？

如果問題持續，請提供：

1. 瀏覽器 Console 的截圖
2. Network 標籤中 faucet 請求的詳細信息
3. 運行 `./diagnose-faucet.sh` 的輸出
4. API 終端的日誌

---

**現在就執行這些步驟，問題應該會完全解決！** 🚀
