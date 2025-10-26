# EVM-Only Simplification

## Changes Made

### 1. Removed Solana Support
- Removed `solana-devnet` from chain configuration
- Removed `pyusdMint` field from ChainMetadata interface
- Changed `chainType` to only support `'evm'`

### 2. Simplified Components
- **WalletProvider**: Now only wraps RainbowKit for EVM wallets
- **App.tsx**: Removed all Solana wallet adapter hooks and logic
- **WalletSummary**: Removed Solana publicKey handling
- **ChainSwitcher**: Removed Solana devnet option
- **wallet/hooks.ts**: Removed all Solana balance fetching logic

### 3. Created Wagmi Configuration
- Created `src/config/wagmi.ts` with proper chain and connector setup
- Supports: Local Hardhat, Sepolia, Arbitrum Sepolia
- Configured WalletConnect and injected connectors

### 4. Removed Dependencies (Optional)
The following Solana dependencies can be removed from `package.json`:
```json
"@solana/wallet-adapter-base": "^0.9.24",
"@solana/wallet-adapter-phantom": "^0.9.28",
"@solana/wallet-adapter-react": "^0.15.32",
"@solana/wallet-adapter-react-ui": "^0.9.26",
"@solana/wallet-adapter-solflare": "^0.6.26",
"@solana/web3.js": "^1.95.1",
"bs58": "^6.0.0",
"buffer": "^6.0.3"
```

## Testing

1. Start local Hardhat node:
   ```bash
   cd templates/monorepo
   pnpm chain
   ```

2. Deploy contracts:
   ```bash
   pnpm deploy:local
   ```

3. Start API server:
   ```bash
   cd apps/api
   pnpm dev
   ```

4. Start web app:
   ```bash
   cd apps/web
   pnpm dev
   ```

5. Test faucet:
   - Connect MetaMask to localhost:8545
   - Navigate to /app
   - Click "領取本地測試資產"
   - Should receive 1 ETH and 100 PYUSD

## Benefits

- Simpler codebase with single wallet system
- No Buffer polyfill needed
- Faster development iteration
- Easier debugging
- Reduced bundle size
