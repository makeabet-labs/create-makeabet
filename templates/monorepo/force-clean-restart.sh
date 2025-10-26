#!/bin/bash

# Force Clean and Restart
# This script completely cleans all caches and restarts the development environment

set -e

echo "🧹 Force Clean and Restart"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from monorepo root (templates/monorepo)"
  exit 1
fi

echo "⚠️  This will:"
echo "   - Stop all running services"
echo "   - Clean all build caches"
echo "   - Clean Vite cache"
echo "   - Clean Turbo cache"
echo "   - Restart all services"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "1️⃣ Cleaning Vite cache..."
rm -rf apps/web/node_modules/.vite
rm -rf apps/web/dist
echo "✅ Vite cache cleaned"

echo ""
echo "2️⃣ Cleaning Turbo cache..."
rm -rf .turbo
echo "✅ Turbo cache cleaned"

echo ""
echo "3️⃣ Cleaning API build..."
rm -rf apps/api/dist
echo "✅ API build cleaned"

echo ""
echo "4️⃣ Cleaning Worker build..."
rm -rf apps/worker/dist
echo "✅ Worker build cleaned"

echo ""
echo "5️⃣ Cleaning Contracts artifacts..."
rm -rf apps/contracts/artifacts
rm -rf apps/contracts/cache
echo "✅ Contracts artifacts cleaned"

echo ""
echo "=========================="
echo "✅ All caches cleaned!"
echo "=========================="
echo ""
echo "Now starting services..."
echo ""
echo "📝 Important: After services start, you MUST:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)"
echo "   3. Or use Incognito/Private mode"
echo ""
echo "Starting in 3 seconds..."
sleep 3

echo ""
echo "🚀 Starting pnpm dev..."
echo ""

pnpm dev
