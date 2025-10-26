#!/bin/bash

# Diagnose Faucet Issue
# This script checks all aspects of the faucet setup

echo "🔍 Faucet Diagnostic Tool"
echo "========================="
echo ""

# 1. Check deployment artifacts
echo "1️⃣ Checking deployment artifacts..."
if [ -f "apps/contracts/deployments/local.json" ]; then
  echo "✅ Deployment file exists"
  cat apps/contracts/deployments/local.json | jq '.'
else
  echo "❌ No deployment file found"
  exit 1
fi

echo ""

# 2. Check API .env.local
echo "2️⃣ Checking API environment..."
if [ -f "apps/api/.env.local" ]; then
  echo "✅ API .env.local exists"
  echo "Key variables:"
  grep "LOCAL_CHAIN_ENABLED" apps/api/.env.local
  grep "LOCAL_FAUCET_PRIVATE_KEY" apps/api/.env.local | head -c 60
  echo "..."
  grep "LOCAL_PYUSD_ADDRESS" apps/api/.env.local
  grep "LOCAL_RPC_URL" apps/api/.env.local
else
  echo "❌ API .env.local not found"
  exit 1
fi

echo ""

# 3. Check faucet wallet on chain
echo "3️⃣ Checking faucet wallet on chain..."
FAUCET_ADDRESS=$(grep "LOCAL_FAUCET_ADDRESS" apps/api/.env.local | cut -d= -f2)
echo "Faucet address: $FAUCET_ADDRESS"

# Get balance
BALANCE_RESPONSE=$(curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$FAUCET_ADDRESS\",\"latest\"],\"id\":1}")

BALANCE_HEX=$(echo "$BALANCE_RESPONSE" | jq -r '.result')
if [ "$BALANCE_HEX" != "null" ] && [ -n "$BALANCE_HEX" ]; then
  BALANCE_WEI=$(printf "%d" "$BALANCE_HEX" 2>/dev/null || echo "0")
  BALANCE_ETH=$(echo "scale=2; $BALANCE_WEI / 1000000000000000000" | bc 2>/dev/null || echo "0")
  echo "ETH Balance: $BALANCE_ETH ETH"
else
  echo "❌ Could not fetch balance"
fi

# Get nonce
NONCE_RESPONSE=$(curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$FAUCET_ADDRESS\",\"latest\"],\"id\":1}")

NONCE_HEX=$(echo "$NONCE_RESPONSE" | jq -r '.result')
if [ "$NONCE_HEX" != "null" ] && [ -n "$NONCE_HEX" ]; then
  NONCE=$(printf "%d" "$NONCE_HEX" 2>/dev/null || echo "0")
  echo "Current nonce: $NONCE"
else
  echo "❌ Could not fetch nonce"
fi

echo ""

# 4. Check PYUSD balance
echo "4️⃣ Checking PYUSD balance..."
PYUSD_ADDRESS=$(grep "LOCAL_PYUSD_ADDRESS" apps/api/.env.local | cut -d= -f2)
echo "PYUSD contract: $PYUSD_ADDRESS"

# ERC20 balanceOf call
BALANCE_OF_DATA="0x70a08231000000000000000000000000${FAUCET_ADDRESS:2}"
PYUSD_BALANCE_RESPONSE=$(curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$PYUSD_ADDRESS\",\"data\":\"$BALANCE_OF_DATA\"},\"latest\"],\"id\":1}")

PYUSD_BALANCE_HEX=$(echo "$PYUSD_BALANCE_RESPONSE" | jq -r '.result')
if [ "$PYUSD_BALANCE_HEX" != "null" ] && [ -n "$PYUSD_BALANCE_HEX" ]; then
  PYUSD_BALANCE_WEI=$(printf "%d" "$PYUSD_BALANCE_HEX" 2>/dev/null || echo "0")
  PYUSD_BALANCE=$(echo "scale=2; $PYUSD_BALANCE_WEI / 1000000" | bc 2>/dev/null || echo "0")
  echo "PYUSD Balance: $PYUSD_BALANCE PYUSD"
else
  echo "⚠️  Could not fetch PYUSD balance"
fi

echo ""

# 5. Test API config endpoint
echo "5️⃣ Testing API config..."
CONFIG_RESPONSE=$(curl -s http://localhost:4000/api/config)
if echo "$CONFIG_RESPONSE" | jq -e '.localChainEnabled' > /dev/null 2>&1; then
  LOCAL_ENABLED=$(echo "$CONFIG_RESPONSE" | jq -r '.localChainEnabled')
  echo "Local chain enabled: $LOCAL_ENABLED"
  
  if [ "$LOCAL_ENABLED" = "true" ]; then
    echo "✅ Faucet should be available"
  else
    echo "❌ Faucet is NOT enabled in API"
  fi
else
  echo "❌ Could not fetch API config"
fi

echo ""

# 6. Make a test faucet request with detailed output
echo "6️⃣ Testing faucet endpoint..."
TEST_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
echo "Test address: $TEST_ADDRESS"

FAUCET_RESPONSE=$(curl -s -X POST http://localhost:4000/api/faucet \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$TEST_ADDRESS\"}" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$FAUCET_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$FAUCET_RESPONSE" | grep -v "HTTP_CODE")

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Faucet request successful!"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "❌ Faucet endpoint not found (404)"
  echo "   This means the route is not registered"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "⚠️  Server error (500)"
  echo "   Check API logs for detailed error"
fi

echo ""
echo "========================="
echo "📋 Summary"
echo "========================="
echo "Deployment: $([ -f "apps/contracts/deployments/local.json" ] && echo "✅" || echo "❌")"
echo "API Config: $([ -f "apps/api/.env.local" ] && echo "✅" || echo "❌")"
echo "Faucet Balance: $BALANCE_ETH ETH, $PYUSD_BALANCE PYUSD"
echo "API Endpoint: $([ "$HTTP_CODE" != "404" ] && echo "✅ Registered" || echo "❌ Not Found")"
echo "Faucet Status: $([ "$HTTP_CODE" = "200" ] && echo "✅ Working" || echo "⚠️  Error $HTTP_CODE")"
