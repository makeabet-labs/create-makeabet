#!/bin/bash

# Test EVM-Only Setup
# This script verifies that the EVM-only configuration is working

set -e

echo "🔍 Testing EVM-Only Setup..."
echo ""

# Check if required files exist
echo "✓ Checking configuration files..."
test -f "apps/web/src/config/wagmi.ts" && echo "  ✓ wagmi.ts exists"
test -f "apps/web/src/config/chains.ts" && echo "  ✓ chains.ts exists"
test -f "apps/api/.env.local" && echo "  ✓ API .env.local exists"

# Check if Solana imports are removed
echo ""
echo "✓ Checking for Solana imports..."
if grep -r "@solana" apps/web/src --include="*.ts" --include="*.tsx" 2>/dev/null; then
  echo "  ✗ Found Solana imports!"
  exit 1
else
  echo "  ✓ No Solana imports found"
fi

# Check if LOCAL_CHAIN_ENABLED is set
echo ""
echo "✓ Checking API configuration..."
if grep -q "LOCAL_CHAIN_ENABLED=true" apps/api/.env.local; then
  echo "  ✓ LOCAL_CHAIN_ENABLED=true"
else
  echo "  ✗ LOCAL_CHAIN_ENABLED not set to true"
  exit 1
fi

# Check TypeScript compilation
echo ""
echo "✓ Checking TypeScript compilation..."
cd apps/web
if pnpm exec tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo "  ✗ TypeScript errors found"
  pnpm exec tsc --noEmit
  exit 1
else
  echo "  ✓ No TypeScript errors"
fi

cd ../..

echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Start Hardhat: pnpm chain"
echo "2. Deploy contracts: pnpm deploy:local"
echo "3. Start API: cd apps/api && pnpm dev"
echo "4. Start web: cd apps/web && pnpm dev"
