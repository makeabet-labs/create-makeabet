# 🚨 關鍵修復：移除編譯後的舊文件

## 問題根源

你遇到的 "publicKey" 錯誤是因為：

**有舊的 JavaScript 編譯文件（.js）還包含 Solana 代碼！**

即使我們更新了 TypeScript 源文件（.ts），Vite 或 TypeScript 編譯器生成的舊 .js 文件還在，並且這些文件還包含 Solana 引用。

## 已刪除的文件

我已經刪除了：
- `apps/web/src/wallet/hooks.js` - 包含 Solana wallet adapter 代碼
- 其他編譯後的 .js 文件

## 立即執行

### 方案 1: 使用清理腳本（推薦）

```bash
cd templates/monorepo

# 停止當前服務 (Ctrl+C)

# 運行清理腳本
./force-clean-restart.sh
```

這會：
1. 清理所有 Vite 緩存
2. 清理所有 Turbo 緩存
3. 清理所有構建產物
4. 重新啟動服務

### 方案 2: 手動清理

```bash
cd templates/monorepo

# 停止當前服務 (Ctrl+C)

# 清理所有緩存和構建產物
rm -rf apps/web/node_modules/.vite
rm -rf apps/web/dist
rm -rf .turbo
rm -rf apps/api/dist
rm -rf apps/worker/dist
rm -rf apps/contracts/artifacts
rm -rf apps/contracts/cache

# 重新啟動
pnpm dev
```

### 方案 3: 完全重新安裝（如果問題持續）

```bash
cd templates/monorepo

# 停止所有服務

# 完全清理
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf .turbo
rm -rf apps/web/node_modules/.vite
rm -rf apps/web/dist

# 重新安裝
pnpm install

# 啟動
pnpm dev
```

## 瀏覽器清理

**非常重要！** 啟動後：

1. 打開 http://localhost:5173
2. 按 **Cmd+Option+I** (Mac) 或 **F12** (Windows/Linux) 打開開發者工具
3. 右鍵點擊刷新按鈕
4. 選擇 "清空緩存並硬性重新載入"

或者：

1. 使用無痕/隱私模式
2. 訪問 http://localhost:5173
3. 測試功能

## 驗證步驟

啟動後，檢查：

### 1. 檢查 Console 錯誤

打開瀏覽器 Console (F12)，應該**沒有**：
- ❌ "publicKey" 錯誤
- ❌ "@solana/wallet-adapter" 錯誤
- ❌ "WalletContext" 錯誤

### 2. 檢查 Network 請求

在 Network 標籤中，點擊 Faucet 按鈕時應該看到：
- ✅ Request URL: `http://localhost:4000/api/faucet`
- ✅ Method: POST
- ✅ Status: 200 或 500（不是 404）

### 3. 檢查功能

- ✅ 可以連接 MetaMask
- ✅ Wallet Summary 顯示地址
- ✅ ETH Balance 正常顯示
- ✅ PYUSD Balance 正常顯示（可能是 0.00）
- ✅ Faucet 按鈕可點擊
- ✅ 點擊後收到通知（成功或明確錯誤）

## 為什麼會有 .js 文件？

TypeScript 項目中出現 .js 文件通常是因為：

1. **TypeScript 編譯器輸出** - `tsc` 會生成 .js 文件
2. **Vite 預構建** - Vite 會預編譯依賴
3. **舊的構建產物** - 之前的構建留下的文件

在開發模式下，這些文件通常不應該存在於 `src` 目錄中。

## 預防措施

為了避免將來出現類似問題：

### 1. 添加 .gitignore

確保 `.gitignore` 包含：
```
# Build outputs
dist/
*.js
*.js.map
!*.config.js
!*.test.js

# Caches
.turbo/
.vite/
node_modules/
```

### 2. 清理腳本

在 `package.json` 中添加清理腳本：
```json
{
  "scripts": {
    "clean": "rm -rf .turbo apps/*/dist apps/*/.vite apps/*/node_modules/.vite",
    "clean:all": "rm -rf node_modules apps/*/node_modules .turbo apps/*/dist"
  }
}
```

### 3. 定期清理

當遇到奇怪的錯誤時，首先嘗試：
```bash
pnpm clean
pnpm dev
```

## 成功標準

當你看到以下情況時，說明問題已解決：

1. ✅ 瀏覽器 Console 無 "publicKey" 錯誤
2. ✅ Wallet Summary 正常工作
3. ✅ PYUSD Balance 正常顯示
4. ✅ Faucet 調用正確的 API (`http://localhost:4000/api/faucet`)
5. ✅ 可以成功領取測試資產

## 如果問題持續

如果清理後問題仍然存在：

1. **檢查是否還有 .js 文件**：
   ```bash
   find apps/web/src -name "*.js" ! -path "*/node_modules/*" ! -path "*/test/*"
   ```
   
   如果有，刪除它們：
   ```bash
   find apps/web/src -name "*.js" ! -path "*/node_modules/*" ! -path "*/test/*" -delete
   ```

2. **檢查 Vite 配置**：
   確保 `apps/web/vite.config.ts` 沒有配置輸出 .js 文件到 src 目錄

3. **檢查 TypeScript 配置**：
   確保 `apps/web/tsconfig.json` 的 `outDir` 不是 `src`

4. **使用無痕模式測試**：
   這樣可以排除瀏覽器緩存問題

## 下一步

清理並重啟後，你應該能夠：

1. ✅ 正常連接錢包
2. ✅ 查看 ETH 和 PYUSD 餘額
3. ✅ 使用 Faucet 領取測試資產
4. ✅ 開始開發其他功能

---

**記住**: 每次遇到奇怪的錯誤時，首先嘗試清理緩存和重啟！
