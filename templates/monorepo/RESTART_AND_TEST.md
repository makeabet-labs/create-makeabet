# 完整重啟和測試指南

## 問題總結

你遇到的問題：

1. ❌ **WalletSummary 錯誤**: "You have tried to read 'publicKey' on a WalletContext"
   - **原因**: 瀏覽器緩存了舊的編譯代碼（還包含 Solana 引用）
   
2. ❌ **API 調用錯誤**: 
   - `http://localhost:4000/faucet` → 404（缺少 `/api` prefix）
   - `http://localhost:5173/api/faucet` → 錯誤（應該是 4000 不是 5173）
   - **原因**: 同樣是舊代碼緩存問題

## 解決方案：完全重啟

### 步驟 1: 停止所有服務

按 `Ctrl+C` 停止當前的 `pnpm dev`

### 步驟 2: 清理緩存和構建產物

```bash
cd templates/monorepo

# 清理 Vite 緩存
rm -rf apps/web/node_modules/.vite
rm -rf apps/web/dist

# 清理 Turbo 緩存（可選）
rm -rf .turbo

# 清理瀏覽器緩存的最簡單方法：
# 在瀏覽器中按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows/Linux) 硬刷新
```

### 步驟 3: 重新啟動

```bash
# 在 templates/monorepo 目錄
pnpm dev
```

等待所有服務啟動，你應該看到：
```
[0] Hardhat 啟動...
[1] @makeabet/api:dev: Server listening at http://127.0.0.1:4000
[1] @makeabet/web:dev: Local: http://localhost:5173/
```

### 步驟 4: 清理瀏覽器緩存

**重要！** 在瀏覽器中：

1. 打開 http://localhost:5173
2. 按 **Cmd+Shift+R** (Mac) 或 **Ctrl+Shift+R** (Windows/Linux) 進行硬刷新
3. 或者打開開發者工具 (F12)，右鍵點擊刷新按鈕，選擇 "清空緩存並硬性重新載入"

### 步驟 5: 測試

1. **連接錢包**:
   - 點擊右上角 "Connect Wallet"
   - 選擇 MetaMask
   - 確認連接到 Localhost 8545 (Chain ID: 31337)

2. **檢查 Wallet Summary**:
   - 應該顯示你的地址
   - ETH Balance 應該正常顯示
   - PYUSD Balance 應該正常顯示（可能是 0.00）
   - **不應該有任何 "publicKey" 錯誤**

3. **測試 Faucet**:
   - 點擊 "Request Faucet" 按鈕
   - 應該看到成功通知
   - 餘額應該更新

## 驗證 API 調用

打開瀏覽器開發者工具 (F12) → Network 標籤：

當你點擊 "Request Faucet" 時，應該看到：
- ✅ **Request URL**: `http://localhost:4000/api/faucet`
- ✅ **Method**: POST
- ✅ **Status**: 200 (成功) 或 500 (服務器錯誤，但端點存在)

**不應該看到**：
- ❌ `http://localhost:4000/faucet` (缺少 /api)
- ❌ `http://localhost:5173/api/faucet` (錯誤的端口)
- ❌ 404 錯誤

## 如果問題持續

### 選項 A: 完全清理並重新安裝

```bash
cd templates/monorepo

# 停止所有服務
# Ctrl+C

# 清理所有
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf .turbo
rm -rf apps/web/node_modules/.vite
rm -rf apps/web/dist

# 重新安裝
pnpm install

# 重新啟動
pnpm dev
```

### 選項 B: 使用無痕模式測試

1. 打開瀏覽器的無痕/隱私模式
2. 訪問 http://localhost:5173
3. 連接 MetaMask
4. 測試功能

這樣可以確保沒有任何緩存干擾。

### 選項 C: 檢查實際編譯的代碼

```bash
# 查看 Vite 編譯的代碼
cat apps/web/node_modules/.vite/deps/_metadata.json

# 或者直接檢查瀏覽器加載的文件
# 在 Network 標籤中找到 WalletSummary.js，查看其內容
```

## 成功標準

當一切正常時，你應該看到：

1. ✅ 前端無 console 錯誤
2. ✅ Wallet Summary 正常顯示餘額
3. ✅ Network 標籤顯示正確的 API 調用 (`http://localhost:4000/api/faucet`)
4. ✅ Faucet 按鈕可以點擊
5. ✅ 點擊後收到成功通知或明確的錯誤信息（不是 404）

## 快速測試命令

在新終端中運行：

```bash
cd templates/monorepo

# 測試 API 端點
curl -X POST http://localhost:4000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}'

# 應該返回 JSON，不是 404
```

## 調試技巧

### 1. 檢查前端實際使用的 API URL

在瀏覽器 Console 中運行：
```javascript
console.log(import.meta.env.VITE_API_URL)
```

應該輸出：`http://localhost:4000`

### 2. 檢查 Faucet 組件的實際代碼

在瀏覽器 Console 中：
```javascript
// 查看 Faucet 組件的源碼
// 在 Sources 標籤中找到 Faucet.tsx
// 確認 API URL 是 ${apiUrl}/api/faucet
```

### 3. 監控 API 日誌

在 API 終端中，你應該看到每個請求的日誌：
```json
{"level":30,"msg":"incoming request","req":{"method":"POST","url":"/api/faucet"}}
```

如果看到 `/faucet` 而不是 `/api/faucet`，說明前端還在使用舊代碼。

## 下一步

完成重啟後，如果：
- ✅ **成功**: 太好了！繼續開發其他功能
- ⚠️ **還是有問題**: 請提供：
  1. 瀏覽器 Console 的完整錯誤
  2. Network 標籤中 faucet 請求的詳細信息
  3. API 終端的日誌
