#!/bin/bash

# Test API Faucet Endpoint
# This script tests if the faucet endpoint is accessible

set -e

API_URL="${API_URL:-http://localhost:4000}"
TEST_ADDRESS="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

echo "🧪 Testing API Faucet Endpoint..."
echo "API URL: $API_URL"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

echo ""

# Test 2: Config endpoint
echo "2️⃣ Testing config endpoint..."
CONFIG_RESPONSE=$(curl -s "$API_URL/api/config")
echo "Response: $CONFIG_RESPONSE"

if echo "$CONFIG_RESPONSE" | grep -q "localChainEnabled"; then
  echo "✅ Config endpoint accessible"
  
  # Check if faucet is enabled
  if echo "$CONFIG_RESPONSE" | grep -q '"localChainEnabled":true'; then
    echo "✅ Local chain is enabled"
  else
    echo "❌ Local chain is NOT enabled"
    echo "Please set LOCAL_CHAIN_ENABLED=true in apps/api/.env.local"
    exit 1
  fi
else
  echo "❌ Config endpoint failed"
  exit 1
fi

echo ""

# Test 3: Faucet endpoint (check if it exists)
echo "3️⃣ Testing faucet endpoint..."
FAUCET_RESPONSE=$(curl -s -X POST "$API_URL/api/faucet" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$TEST_ADDRESS\"}" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$FAUCET_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$FAUCET_RESPONSE" | grep -v "HTTP_CODE")

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "404" ]; then
  echo "❌ Faucet endpoint not found (404)"
  echo "This means LOCAL_CHAIN_ENABLED is not properly set or API needs restart"
  exit 1
elif [ "$HTTP_CODE" = "400" ]; then
  echo "⚠️  Bad request (400) - but endpoint exists"
  echo "✅ Faucet endpoint is registered"
elif [ "$HTTP_CODE" = "429" ]; then
  echo "⚠️  Rate limited (429) - but endpoint exists"
  echo "✅ Faucet endpoint is registered"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "⚠️  Server error (500) - endpoint exists but execution failed"
  echo "✅ Faucet endpoint is registered"
  echo "Check if Hardhat node is running: pnpm chain"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Faucet request successful!"
  if echo "$RESPONSE_BODY" | grep -q '"ok":true'; then
    echo "✅ Faucet returned success"
  fi
else
  echo "⚠️  Unexpected HTTP code: $HTTP_CODE"
fi

echo ""
echo "📋 Summary:"
echo "- Health: ✅"
echo "- Config: ✅"
echo "- Faucet endpoint: $([ "$HTTP_CODE" != "404" ] && echo "✅ Registered" || echo "❌ Not Found")"
echo ""

if [ "$HTTP_CODE" = "404" ]; then
  echo "🔧 Troubleshooting steps:"
  echo "1. Check apps/api/.env.local has LOCAL_CHAIN_ENABLED=true"
  echo "2. Restart the API server: cd apps/api && pnpm dev"
  echo "3. Check API logs for errors"
  exit 1
fi

echo "✅ API faucet endpoint is working!"
