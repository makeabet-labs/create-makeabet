#!/bin/bash

# Test faucet and show what error is actually happening

echo "🧪 Testing faucet with a fresh address..."
echo ""

TEST_ADDRESS="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

echo "Sending request to faucet..."
echo "Address: $TEST_ADDRESS"
echo ""

# Make the request
RESPONSE=$(curl -s -X POST http://localhost:4000/api/faucet \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$TEST_ADDRESS\"}" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "HTTP Code: $HTTP_CODE"
echo "Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Success!"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "⚠️  Server error - Check API terminal for detailed logs"
  echo ""
  echo "The API should show a log with 'fullErrorMessage' containing the actual error."
  echo "Look for lines like:"
  echo '  {"level":50,"fullErrorMessage":"...","msg":"Full error details"}'
fi
