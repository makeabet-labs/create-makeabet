# Pyth Network Integration

## Overview

The MakeABet app now displays real-time cryptocurrency prices using Pyth Network's Hermes API.

## Features

### Live Price Feeds

The app displays real-time prices for:
- **BTC/USD** - Bitcoin
- **ETH/USD** - Ethereum
- **SOL/USD** - Solana
- **USDC/USD** - USD Coin
- **USDT/USD** - Tether
- **BNB/USD** - Binance Coin

### Data Updates

- **Update Frequency**: Every 5 seconds
- **Data Source**: Pyth Hermes Stable API
- **Confidence Intervals**: Displayed for each price
- **Last Update Time**: Shows how recent the data is

## Implementation

### Component: `PythPriceFeeds.tsx`

Located at: `apps/web/src/components/PythPriceFeeds.tsx`

**Key Features**:
- Fetches data from Pyth Hermes API
- Auto-refreshes every 5 seconds
- Displays price with confidence intervals
- Shows last update timestamp
- Responsive grid layout

### API Endpoint

```
https://hermes.pyth.network/v2/updates/price/latest
```

### Price Feed IDs

Each cryptocurrency has a unique Price Feed ID:

```typescript
const PRICE_FEEDS = {
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  // ... more feeds
};
```

## Usage

The component is integrated into the "MakeABet App" tab:

1. Navigate to the app
2. Click on the "MakeABet App" tab
3. View real-time price feeds

## Adding More Price Feeds

To add more cryptocurrencies:

1. Find the Price Feed ID from [Pyth Price Feed IDs](https://pyth.network/developers/price-feed-ids)
2. Add to the `PRICE_FEEDS` object in `PythPriceFeeds.tsx`:

```typescript
const PRICE_FEEDS = {
  // ... existing feeds
  'NEW_SYMBOL/USD': '0x...price_feed_id...',
};
```

## Pyth Network Resources

### Contract Addresses (for on-chain integration)

- **Arbitrum Sepolia (testnet)**: `0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF`
- **Sepolia (Ethereum testnet)**: `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21`

### Documentation

- [Pyth Price Feeds](https://docs.pyth.network/price-feeds)
- [Hermes API Reference](https://hermes.pyth.network/docs)
- [Price Feed IDs](https://pyth.network/developers/price-feed-ids)

## On-Chain Integration (Future)

For on-chain price verification, you can use the Pyth contract:

```solidity
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract YourContract {
    IPyth pyth;
    
    constructor(address pythContract) {
        pyth = IPyth(pythContract);
    }
    
    function getPrice(bytes32 priceId) public view returns (int64) {
        PythStructs.Price memory price = pyth.getPrice(priceId);
        return price.price;
    }
}
```

## Error Handling

The component includes:
- Loading states with skeletons
- Error messages if API fails
- Automatic retry on interval
- Graceful degradation

## Performance

- **Lightweight**: Uses native `fetch` API
- **Efficient**: Only fetches needed price feeds
- **Optimized**: Updates in background without blocking UI
- **Responsive**: Grid layout adapts to screen size

## Next Steps

1. **Add Market Creation**: Allow users to create prediction markets based on these prices
2. **Historical Data**: Show price charts and trends
3. **Alerts**: Notify users when prices hit certain thresholds
4. **On-Chain Verification**: Integrate with Pyth smart contracts for trustless price feeds
5. **More Assets**: Add equities, commodities, and other asset classes

## Testing

To test the integration:

1. Start the development server: `pnpm dev`
2. Navigate to http://localhost:5173/app
3. Click on "MakeABet App" tab
4. Verify prices are loading and updating
5. Check browser console for any errors

## Troubleshooting

### Prices not loading

- Check browser console for errors
- Verify internet connection
- Check if Hermes API is accessible: https://hermes.pyth.network/docs

### Stale data

- Component updates every 5 seconds
- Check the "Last Update" timestamp
- Refresh the page if needed

### CORS errors

- Hermes API supports CORS
- If issues persist, consider using a proxy in production
