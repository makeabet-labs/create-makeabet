#!/bin/bash

# MakeABet Demo 簡易啟動腳本（不需要區塊鏈）

echo "🚀 Starting MakeABet Demo (Frontend Only)..."
echo ""

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the monorepo root directory"
    exit 1
fi

# 檢查 pnpm 是否安裝
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi

echo "✅ Starting services..."
echo ""
echo "📡 API Server: http://localhost:4000"
echo "🌐 Web App: http://localhost:5173"
echo ""
echo "🎯 Open http://localhost:5173 in your browser"
echo "📝 Click 'Scaffold' tab to see the prediction markets"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 使用 concurrently 同時運行 API 和 Web
pnpm exec concurrently -k \
  "pnpm --filter @makeabet/api dev" \
  "pnpm --filter @makeabet/web dev"
