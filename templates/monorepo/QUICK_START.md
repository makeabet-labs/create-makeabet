# 🚀 MakeABet Demo 快速啟動

## 最快的方式開始

### 選項 1: 簡易模式（推薦用於 Demo）

只啟動前端和 API，不需要區塊鏈：

```bash
cd templates/monorepo
./start-demo-simple.sh
```

然後打開瀏覽器訪問：http://localhost:5173

### 選項 2: 完整模式（包含區塊鏈）

啟動完整的開發環境：

```bash
cd templates/monorepo
pnpm run dev
```

## 📱 如何使用 Demo

1. **打開應用**
   - 訪問 http://localhost:5173
   - 點擊頂部的 **"Scaffold"** 標籤

2. **查看市場**
   - 向下滾動到 "Prediction Markets" 區塊
   - 你會看到 5 個加密貨幣預測市場

3. **下注**
   - 點擊任何市場的 **"Place Bet"** 按鈕
   - 選擇 **Bullish** (看多) 或 **Bearish** (看空)
   - 輸入金額（例如：50 PYUSD）
   - 點擊 **"Place Bullish Bet"** 或 **"Place Bearish Bet"**

4. **查看結果**
   - 你的下注會立即顯示在市場卡片上
   - 市場會移到 "Your Active Bets" 區塊
   - 你可以看到潛在收益

## 🎯 Demo 特點

### 已實作的功能
✅ 市場列表顯示  
✅ 實時價格數據（Pyth Network）  
✅ 下注流程（前端模擬）  
✅ 用戶持倉顯示  
✅ 潛在收益計算  
✅ 響應式設計  

### Mock 數據
- **BTC**: Will BTC reach $120,000 by end of week?
- **ETH**: Will ETH stay above $4,000 for next 24h?
- **SOL**: Will SOL break $200 this week?
- **USDC**: Will USDC maintain $1.00 peg?
- **BNB**: Will BNB reach $700 by month end?

## 🎨 UI 預覽

每個市場卡片顯示：
- 📊 預測問題
- 🎯 目標價格 vs 當前價格
- ⏰ 剩餘時間倒數
- 📈 看多/看空比例（進度條）
- 💰 總池金額
- 🏷️ 你的持倉（如果有）

## 🔧 故障排除

### 端口被佔用
如果看到端口錯誤：
```bash
# 停止所有服務
pkill -f "vite"
pkill -f "tsx"

# 重新啟動
./start-demo-simple.sh
```

### 依賴問題
```bash
# 重新安裝依賴
pnpm install

# 清理並重新安裝
pnpm clean:all
pnpm install
```

## 📚 更多資訊

詳細的測試指南請查看：[TEST_MARKET_DEMO.md](./TEST_MARKET_DEMO.md)

## 🎉 準備好展示了！

現在你有一個完整的前端 demo，可以展示：
1. 完整的用戶流程
2. 專業的 UI/UX
3. 實時數據整合
4. 可擴展的架構

如果需要整合智能合約，我們可以在後續添加！
