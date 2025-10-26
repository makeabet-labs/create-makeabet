# 🔗 啟用 Live Contract 模式

## 當前狀態
你看到 "Demo Mode" 是因為：
1. ✅ 環境變量已設置（剛剛更新）
2. ❌ 需要重啟 web 服務器
3. ❌ 需要連接錢包

## 🚀 啟用步驟

### 步驟 1: 重啟 Web 服務器

如果你使用 `pnpm dev`：
```bash
# 按 Ctrl+C 停止
# 然後重新啟動
pnpm dev
```

如果你單獨運行 web：
```bash
# 按 Ctrl+C 停止
# 然後重新啟動
pnpm --filter @makeabet/web dev
```

### 步驟 2: 連接錢包

1. 打開 http://localhost:5173
2. 點擊右上角的 "Connect Wallet" 按鈕
3. 選擇 MetaMask（或其他錢包）
4. 確保連接到 **Hardhat Local** 網絡

### 步驟 3: 添加 Hardhat 網絡到 MetaMask

如果 MetaMask 沒有 Hardhat 網絡：

1. 打開 MetaMask
2. 點擊網絡下拉選單
3. 點擊 "Add Network"
4. 點擊 "Add a network manually"
5. 填寫：
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
6. 點擊 "Save"

### 步驟 4: 導入測試賬戶（可選）

使用 Hardhat 的第一個測試賬戶：

1. 打開 MetaMask
2. 點擊賬戶圖標
3. 選擇 "Import Account"
4. 貼上私鑰：
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
5. 這個賬戶有 10,000 ETH

## ✅ 驗證 Live Contract 模式

重啟後，你應該看到：

### 在 "Prediction Markets" 標題下方：
- 🟢 **Live Contract** 標記（綠色）
- 而不是 ⚪ **Demo Mode**（灰色）

### 控制台日誌：
打開瀏覽器開發者工具（F12），你會看到：
```
Market address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
PYUSD address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Using real contract: true
```

## 🧪 測試 Live Contract

### 1. 獲取測試代幣
1. 切換到 "Overview" 標籤
2. 向下滾動找到 Faucet
3. 點擊 "Request Tokens"
4. 等待交易確認
5. 你會收到 1 ETH 和 100 PYUSD

### 2. 創建市場
1. 切換到 "Scaffold" 標籤
2. 在 "Live Price Feeds" 選擇資產
3. 點擊 "Create Market"
4. 填寫表單
5. MetaMask 會彈出確認
6. 確認交易

### 3. 下注
1. 選擇一個市場
2. 點擊 "Place Bet"
3. 選擇立場和金額
4. MetaMask 會彈出兩次：
   - 第一次：批准 PYUSD
   - 第二次：執行下注
5. 確認兩次交易

## 🐛 故障排除

### 問題：還是顯示 "Demo Mode"
**解決**：
1. 確認已重啟 web 服務器
2. 確認錢包已連接
3. 確認連接到 Hardhat 網絡（Chain ID: 31337）
4. 檢查瀏覽器控制台是否有錯誤

### 問題：MetaMask 沒有彈出
**解決**：
1. 檢查 MetaMask 是否已解鎖
2. 檢查是否連接到正確的網絡
3. 刷新頁面重試

### 問題：交易失敗 "insufficient funds"
**解決**：
1. 使用 Faucet 獲取測試代幣
2. 確保有足夠的 ETH 支付 gas
3. 確保有足夠的 PYUSD 下注

### 問題：找不到合約
**解決**：
1. 確認 Hardhat 節點正在運行
2. 確認合約已部署（`pnpm deploy:local`）
3. 檢查 `.env.local` 中的合約地址

## 📝 環境變量說明

當前設置：
```env
VITE_MARKET_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_PYUSD_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

這些地址來自本地部署，每次重新部署可能會改變。

## 🎯 快速命令

```bash
# 完整重啟（如果需要）
pnpm dev

# 只重啟 web
pnpm --filter @makeabet/web dev

# 重新部署合約
pnpm deploy:local
pnpm sync:local-env
```

---

**完成這些步驟後，你就可以使用真實的智能合約了！** 🎉
