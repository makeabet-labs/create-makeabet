#!/bin/bash

# Reset and Test Faucet
# This script helps diagnose and fix faucet issues

set -e

API_URL="${API_URL:-http://localhost:4000}"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
TEST_ADDRESS="0xc5a132C1C3E82097421C958da6D600C24612EDFd"

echo "🔧 Faucet Diagnostic and Test Tool"
echo "=================================="
echo ""

# Check if Hardhat is running
echo "1️⃣ Checking Hardhat node..."
if curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -q "result"; then
  echo "✅ Hardhat node is running"
else
  echo "❌ Hardhat node is NOT running"
  echo "Please start it with: pnpm chain"
  exit 1
fi

# Check API
echo ""
echo "2️⃣ Checking API server..."
if curl -s "$API_URL/api/health" | grep -q "ok"; then
  echo "✅ API server is running"
else
  echo "❌ API server is NOT running"
  echo "Please start it with: cd apps/api && pnpm dev"
  exit 1
fi

# Check faucet configuration
echo ""
echo "3️⃣ Checking faucet configuration..."
CONFIG=$(curl -s "$API_URL/api/config")
if echo "$CONFIG" | grep -q '"localChainEnabled":true'; then
  echo "✅ Faucet is enabled"
else
  echo "❌ Faucet is NOT enabled"
  echo "Please set LOCAL_CHAIN_ENABLED=true in apps/api/.env.local"
  exit 1
fi

# Get faucet wallet address
FAUCET_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "4️⃣ Checking faucet wallet..."
echo "Faucet address: $FAUCET_ADDRESS"

# Check balance
BALANCE_HEX=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$FAUCET_ADDRESS\",\"latest\"],\"id\":1}" \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$BALANCE_HEX" ]; then
  BALANCE_WEI=$(printf "%d" "$BALANCE_HEX")
  BALANCE_ETH=$(echo "scale=4; $BALANCE_WEI / 1000000000000000000" | bc)
  echo "Balance: $BALANCE_ETH ETH"
  
  if [ $(echo "$BALANCE_ETH < 1" | bc) -eq 1 ]; then
    echo "⚠️  Warning: Low balance"
  else
    echo "✅ Sufficient balance"
  fi
else
  echo "❌ Could not check balance"
fi

# Check nonce
NONCE_HEX=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$FAUCET_ADDRESS\",\"latest\"],\"id\":1}" \
  | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ -n "$NONCE_HEX" ]; then
  NONCE=$(printf "%d" "$NONCE_HEX")
  echo "Current nonce: $NONCE"
fi

# Test faucet endpoint
echo ""
echo "5️⃣ Testing faucet endpoint..."
echo "Requesting funds for: $TEST_ADDRESS"

RESPONSE=$(curl -s -X POST "$API_URL/api/faucet" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$TEST_ADDRESS\"}" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "HTTP Code: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Faucet request successful!"
  
  # Wait a bit for transaction to be mined
  echo ""
  echo "⏳ Waiting for transaction to be mined..."
  sleep 3
  
  # Check recipient balance
  RECIPIENT_BALANCE_HEX=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$TEST_ADDRESS\",\"latest\"],\"id\":1}" \
    | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$RECIPIENT_BALANCE_HEX" ]; then
    RECIPIENT_BALANCE_WEI=$(printf "%d" "$RECIPIENT_BALANCE_HEX")
    RECIPIENT_BALANCE_ETH=$(echo "scale=4; $RECIPIENT_BALANCE_WEI / 1000000000000000000" | bc)
    echo "Recipient balance: $RECIPIENT_BALANCE_ETH ETH"
  fi
  
elif [ "$HTTP_CODE" = "404" ]; then
  echo "❌ Faucet endpoint not found!"
  echo ""
  echo "Troubleshooting:"
  echo "1. Ensure LOCAL_CHAIN_ENABLED=true in apps/api/.env.local"
  echo "2. Restart API server"
  echo "3. Check API logs for errors"
  exit 1
  
elif [ "$HTTP_CODE" = "429" ]; then
  echo "⚠️  Rate limited - please wait and try again"
  
elif [ "$HTTP_CODE" = "500" ]; then
  echo "⚠️  Server error"
  
  if echo "$BODY" | grep -q "busy processing"; then
    echo ""
    echo "💡 Nonce conflict detected. This usually happens when:"
    echo "   - Previous transaction is still pending"
    echo "   - Multiple faucet requests were made simultaneously"
    echo ""
    echo "Solutions:"
    echo "1. Wait 10 seconds and try again"
    echo "2. Restart Hardhat node: pnpm chain"
    echo "3. Redeploy contracts: pnpm deploy:local"
    echo "4. Restart API server"
  elif echo "$BODY" | grep -q "insufficient funds"; then
    echo ""
    echo "💡 Faucet wallet has insufficient funds"
    echo "   Restart Hardhat to reset balances: pnpm chain"
  else
    echo ""
    echo "Error details: $BODY"
  fi
fi

echo ""
echo "=================================="
echo "📋 Summary"
echo "=================================="
echo "Hardhat: ✅"
echo "API: ✅"
echo "Faucet Config: ✅"
echo "Faucet Endpoint: $([ "$HTTP_CODE" != "404" ] && echo "✅" || echo "❌")"
echo "Faucet Status: $([ "$HTTP_CODE" = "200" ] && echo "✅ Working" || echo "⚠️  Check logs")"
