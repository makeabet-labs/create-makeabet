# Design Document

## Overview

This design addresses the wallet context and faucet routing issues in the MakeABet scaffold. The solution involves ensuring proper provider hierarchy, fixing API routing configuration, and improving error handling throughout the application.

## Architecture

### Current Issues

1. **Wallet Context**: The WalletProvider is correctly set up to provide both EVM and Solana contexts, but components may be rendering before the context is fully initialized
2. **API Routing**: The frontend calls `/api/faucet` but the backend route is `/faucet`, and there's no proxy configuration in Vite to forward `/api/*` requests
3. **Error Handling**: Generic error messages don't help users understand what went wrong

### Proposed Solution

```
┌─────────────────────────────────────────┐
│         Vite Dev Server (5173)          │
│  ┌───────────────────────────────────┐  │
│  │   Proxy: /api/* → localhost:4000  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Fastify API Server (4000)          │
│  ┌───────────────────────────────────┐  │
│  │  Routes:                          │  │
│  │  - GET  /api/config               │  │
│  │  - POST /api/faucet               │  │
│  │  - GET  /api/health               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Vite Configuration Update

**File**: `templates/monorepo/apps/web/vite.config.ts`

Add proxy configuration to forward API requests:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
```

### 2. API Router Updates

**File**: `templates/monorepo/apps/api/src/router.ts`

Update all routes to include `/api` prefix:

- `/health` → `/api/health`
- `/config` → `/api/config`
- `/faucet` → `/api/faucet`

This ensures consistency between frontend expectations and backend routes.

### 3. WalletProvider Enhancement

**File**: `templates/monorepo/apps/web/src/providers/WalletProvider.tsx`

The current implementation is correct - it wraps everything with both providers. No changes needed here, but we should verify the provider order is correct:

```
ConnectionProvider (Solana)
  └─ SolanaWalletProvider
      └─ WalletModalProvider
          └─ WagmiProvider (EVM)
              └─ RainbowKitProvider
                  └─ children
```

### 4. Wallet Hooks Safety

**File**: `templates/monorepo/apps/web/src/wallet/hooks.js`

The hooks already handle both chain types correctly. They use conditional logic to determine which wallet system to query. No changes needed.

### 5. Error Handling Improvements

**File**: `templates/monorepo/apps/web/src/components/Faucet.tsx`

Enhance error messages to be more specific:

- Network errors: "Unable to connect to faucet service"
- Rate limit errors: "Please wait X minutes before requesting again"
- Validation errors: "Invalid wallet address"
- Generic errors: Include the actual error message from the API

## Data Models

### Faucet Request

```typescript
interface FaucetRequest {
  address: string; // Ethereum address (0x...)
}
```

### Faucet Response

```typescript
interface FaucetResponse {
  ok: boolean;
  results?: Array<{
    type: 'ETH' | 'PYUSD';
    hash: string;
    amount: string;
  }>;
  message?: string;
  error?: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  ok: false;
  error: string;
  statusCode?: number;
}
```

## Error Handling

### API Level

1. **Validation Errors** (400): Return clear message about what's invalid
2. **Rate Limit Errors** (429): Include cooldown time remaining
3. **Server Errors** (500): Log detailed error, return generic message to client
4. **Busy State** (503): Indicate faucet is processing another request

### Frontend Level

1. **Network Errors**: Check if API is reachable
2. **Timeout Errors**: Indicate request took too long
3. **Validation Errors**: Show field-specific errors
4. **Success State**: Show transaction hashes with explorer links

## Testing Strategy

### Unit Tests

1. Test Vite proxy configuration forwards requests correctly
2. Test API routes respond at `/api/*` paths
3. Test faucet rate limiting logic
4. Test error message formatting

### Integration Tests

1. Test full faucet flow from button click to success message
2. Test wallet context availability in different chain modes
3. Test error handling for various failure scenarios

### Manual Testing

1. Verify faucet works on local Hardhat chain
2. Verify no console errors when switching between chains
3. Verify error messages are user-friendly
4. Verify transaction hashes link to correct explorer
