#!/bin/bash

# MakeABet Demo 啟動腳本

echo "🚀 Starting MakeABet Demo..."
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

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Starting services..."
echo ""
echo "📡 API Server: http://localhost:4000"
echo "🌐 Web App: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 使用 concurrently 同時運行兩個服務
pnpm run dev
