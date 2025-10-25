# Design Document

## Overview

This design document outlines the architecture and implementation strategy for enhancing the `create-makeabet` scaffold to provide a seamless development experience for ETHGlobal hackathon participants. The enhancements build upon the existing Turbo monorepo structure and integrate Hardhat 3, PYUSD token support, Pyth oracle integration, and Railway deployment automation.

The design follows a modular approach, leveraging existing components (ChainProvider, WalletProvider) while adding new capabilities for local development automation, faucet services, and improved UX for chain switching and balance display.

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend (React 19 + Vite)"
        UI[User Interface]
        CP[ChainProvider]
        WP[WalletProvider]
        CS[ChainSwitcher Component]
        WS[WalletSummary Component]
        FC[Faucet Component]
    end
    
    subgraph "Backend (Fastify 5)"
        API[API Server]
        CONFIG[/api/config]
        FAUCET[/api/faucet]
    end
    
    subgraph "Local Development"
        HH[Hardhat Node]
        DEPLOY[Deploy Script]
        SYNC[Sync Script]
    end
    
    subgraph "Blockchain Networks"
        LOCAL[Local Hardhat]
        SEPOLIA[Sepolia Testnet]
        ARB[Arbitrum Sepolia]
        SOL[Solana Devnet]
    end
    
    UI --> CP
    CP --> WP
    UI --> CS
    UI --> WS
    UI --> FC
    
    WP --> LOCAL
    WP --> SEPOLIA
    WP --> ARB
    WP --> SOL
    
    FC --> FAUCET
    FAUCET --> HH
    
    API --> CONFIG
    API --> FAUCET
    
    HH --> DEPLOY
    DEPLOY --> SYNC
    SYNC --> API
    SYNC --> UI
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant ChainSwitcher
    participant ChainProvider
    participant WalletProvider
    participant Blockchain
    participant API
    
    User->>ChainSwitcher: Select "Local Hardhat"
    ChainSwitcher->>ChainProvider: setChain('local-hardhat')
    ChainProvider->>ChainProvider: Update state & localStorage
    ChainProvider->>WalletProvider: Trigger re-render
    WalletProvider->>WalletProvider: Rebuild wagmi config
    WalletProvider->>Blockchain: Connect to localhost:8545
    User->>WalletProvider: Connect wallet
    WalletProvider->>Blockchain: Request balances
    Blockchain-->>WalletProvider: Return ETH + PYUSD
    User->>API: POST /api/faucet
    API->>Blockchain: Transfer tokens
    Blockchain-->>API: Transaction hash
    API-->>User: Success notification
```

## Components and Interfaces

### 1. ChainProvider Enhancement

**Location:** `apps/web/src/providers/ChainProvider.tsx`

**Current State:** Already implemented with basic chain switching

**Enhancements Needed:**
- Add runtime environment variable loading for local chain configuration
- Expose block explorer URL formatting utilities
- Add faucet availability flag

**Interface:**
```typescript
interface ChainContextValue {
  chain: ChainMetadata;
  chainKey: ChainKey;
  setChain: (key: ChainKey) => void;
  availableChains: ChainMetadata[];
  isLocalChain: boolean;
  isFaucetAvailable: boolean;
  getExplorerUrl: (type: 'address' | 'tx', value: string) => string | null;
}
```

**Implementation Notes:**
- Check `import.meta.env.VITE_LOCAL_CHAIN_ENABLED` to determine if local chain is available
- Update `CHAIN_METADATA['local-hardhat']` with deployed contract addresses from env vars
- Provide helper method to format block explorer URLs

### 2. WalletProvider Enhancement

**Location:** `apps/web/src/providers/WalletProvider.tsx`

**Current State:** Already supports dynamic chain switching for EVM and Solana

**Enhancements Needed:**
- Ensure proper cleanup and re-initialization when chain changes
- Add error boundary for wallet connection failures
- Support local Hardhat chain with custom chain configuration

**Implementation Notes:**
- Current implementation already handles local-hardhat by creating custom chain config
- Ensure RPC URL is read from `import.meta.env.VITE_LOCAL_RPC_URL` when on local chain
- Add reconnection logic when switching between chains

### 3. ChainSwitcher Component

**Location:** `apps/web/src/components/ChainSwitcher.tsx` (new)

**Purpose:** UI component for switching between available chains

**Interface:**
```typescript
interface ChainSwitcherProps {
  variant?: 'dropdown' | 'modal';
  size?: 'sm' | 'md' | 'lg';
}

export function ChainSwitcher(props: ChainSwitcherProps): JSX.Element;
```

**Design:**
- Use Mantine `Select` or `Menu` component for dropdown variant
- Use Mantine `Modal` for modal variant
- Display chain icon, name, and network type (EVM/Solana)
- Show current chain with checkmark
- Disable unavailable chains (e.g., local chain when not running)
- Show loading state during chain switch

**Visual Structure:**
```
┌─────────────────────────────┐
│ 🔗 Ethereum Sepolia      ▼ │
├─────────────────────────────┤
│ ✓ Ethereum Sepolia          │
│   Arbitrum Sepolia          │
│   Solana Devnet             │
│ 🔧 Local Hardhat            │
└─────────────────────────────┘
```

### 4. WalletSummary Component

**Location:** `apps/web/src/components/WalletSummary.tsx` (new)

**Purpose:** Display wallet address, balances, and quick actions

**Interface:**
```typescript
interface WalletSummaryProps {
  showFaucet?: boolean;
  showExplorerLink?: boolean;
}

export function WalletSummary(props: WalletSummaryProps): JSX.Element;
```

**Design:**
- Display connected address with copy button
- Show native token balance (ETH/SOL) with loading/error states
- Show PYUSD balance with loading/error states
- Link to block explorer for address
- Show "Request Faucet" button when on local chain
- Use Mantine `Card`, `Group`, `Text`, `Skeleton` components

**Visual Structure:**
```
┌──────────────────────────────────────┐
│ Wallet Summary                       │
├──────────────────────────────────────┤
│ 0x1234...5678 📋 🔗                  │
│                                      │
│ ETH Balance: 10.5 ETH                │
│ PYUSD Balance: 1,000.00 PYUSD        │
│                                      │
│ [Request Faucet] (local only)        │
└──────────────────────────────────────┘
```

### 5. Faucet Component

**Location:** `apps/web/src/components/Faucet.tsx` (new)

**Purpose:** Request test tokens from local faucet

**Interface:**
```typescript
interface FaucetProps {
  address: string;
  onSuccess?: (txHashes: string[]) => void;
  onError?: (error: string) => void;
}

export function Faucet(props: FaucetProps): JSX.Element;
```

**Design:**
- Button with loading state
- Call `/api/faucet` endpoint with connected address
- Show toast notification on success/error
- Display transaction hashes on success
- Disable button during request
- Show cooldown timer if rate limited

**API Integration:**
```typescript
async function requestFaucet(address: string): Promise<FaucetResponse> {
  const response = await fetch('/api/faucet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  return response.json();
}
```

### 6. Balance Hooks

**Location:** `apps/web/src/wallet/hooks.ts` (enhance existing)

**Purpose:** Fetch and manage token balances

**Interface:**
```typescript
interface UseBalanceResult {
  balance: bigint | null;
  formatted: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useNativeBalance(address?: string): UseBalanceResult;
export function usePYUSDBalance(address?: string): UseBalanceResult;
```

**Implementation:**
- Use `wagmi` hooks for EVM chains (`useBalance`, `useReadContract`)
- Use `@solana/web3.js` for Solana chains
- Auto-refresh on chain change
- Cache results with TanStack Query
- Handle loading and error states

### 7. API Faucet Endpoint

**Location:** `apps/api/src/router.ts` (already implemented)

**Current State:** Faucet endpoint exists and is functional

**Enhancements Needed:**
- Add rate limiting per address (1 request per 5 minutes)
- Add configurable amounts via environment variables
- Improve error messages
- Add logging for faucet requests

**Enhanced Implementation:**
```typescript
const faucetRateLimiter = new Map<string, number>();

app.post('/faucet', async (request, reply) => {
  // Validate LOCAL_CHAIN_ENABLED
  if (process.env.LOCAL_CHAIN_ENABLED !== 'true') {
    reply.code(403);
    return { ok: false, error: 'Faucet only available on local chain' };
  }

  // Parse and validate address
  const parsed = faucetSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const { address } = parsed.data;

  // Rate limiting
  const lastRequest = faucetRateLimiter.get(address);
  const cooldown = 5 * 60 * 1000; // 5 minutes
  if (lastRequest && Date.now() - lastRequest < cooldown) {
    reply.code(429);
    return { ok: false, error: 'Please wait before requesting again' };
  }

  // Transfer tokens
  try {
    const receipts = await transferFaucetTokens(address);
    faucetRateLimiter.set(address, Date.now());
    return { ok: true, transactions: receipts };
  } catch (error) {
    app.log.error({ err: error }, 'Faucet transfer failed');
    reply.code(500);
    return { ok: false, error: 'Transfer failed' };
  }
});
```

### 8. Config Endpoint Enhancement

**Location:** `apps/api/src/router.ts` (enhance existing)

**Enhancements:**
- Add local chain deployment info
- Add faucet availability flag
- Add block explorer URLs

**Enhanced Response:**
```typescript
interface ConfigResponse {
  paypalClientId: string;
  pythEndpoint: string;
  targetChain: string;
  chainType: 'evm' | 'solana';
  pyusdAddress?: string;
  pyusdMint?: string;
  rpcUrl: string;
  localChainEnabled: boolean;
  faucetAvailable: boolean;
  explorerUrl?: string;
  marketAddress?: string;
}
```

## Data Models

### Chain Metadata

**Location:** `apps/web/src/config/chains.ts` (already exists)

**Current Structure:**
```typescript
interface ChainMetadata {
  key: ChainKey;
  name: string;
  chainType: 'evm' | 'solana';
  nativeSymbol: string;
  stableSymbol: string;
  chainId?: string;
  rpcUrl?: string;
  explorerUrl?: string;
  blockExplorerAddressTemplate?: string;
  pyusdAddress?: string;
  pyusdMint?: string;
  faucetUrl?: string;
}
```

**Enhancements:**
- Load local chain addresses from environment variables at runtime
- Add `isLocal` flag
- Add `faucetAvailable` flag

**Enhanced Implementation:**
```typescript
export const CHAIN_METADATA: Record<ChainKey, ChainMetadata> = {
  'local-hardhat': {
    key: 'local-hardhat',
    name: 'Local Hardhat',
    chainType: 'evm',
    nativeSymbol: 'ETH',
    stableSymbol: 'PYUSD',
    chainId: import.meta.env.VITE_LOCAL_CHAIN_ID || '31337',
    rpcUrl: import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545',
    explorerUrl: undefined,
    blockExplorerAddressTemplate: undefined,
    pyusdAddress: import.meta.env.VITE_LOCAL_PYUSD_ADDRESS || '',
    faucetUrl: undefined,
    isLocal: true,
    faucetAvailable: import.meta.env.VITE_LOCAL_CHAIN_ENABLED === 'true',
  },
  // ... other chains
};
```

### Deployment Artifacts

**Location:** `apps/contracts/deployments/local.json`

**Structure:**
```typescript
interface LocalDeployment {
  pyusd: string;      // Mock PYUSD contract address
  market: string;     // MakeABetMarket contract address
  faucet: string;     // Faucet signer address
  timestamp?: number; // Deployment timestamp
  chainId?: number;   // Chain ID (31337)
}
```

### Faucet Request/Response

**Request:**
```typescript
interface FaucetRequest {
  address: string; // Ethereum address (0x...)
}
```

**Response:**
```typescript
interface FaucetResponse {
  ok: boolean;
  transactions?: string[]; // Transaction hashes
  error?: string;
}
```

## Error Handling

### Frontend Error Handling

1. **Wallet Connection Errors**
   - Display user-friendly error messages
   - Provide retry button
   - Log errors to console for debugging

2. **Balance Fetch Errors**
   - Show "Unable to load balance" message
   - Provide refresh button
   - Handle RPC timeout gracefully

3. **Chain Switch Errors**
   - Revert to previous chain on failure
   - Show error notification
   - Log error details

4. **Faucet Request Errors**
   - Display specific error messages (rate limit, network error, etc.)
   - Show retry button after cooldown
   - Handle transaction failures

### Backend Error Handling

1. **Faucet Endpoint Errors**
   - Validate input with Zod schema
   - Return appropriate HTTP status codes (400, 403, 429, 500)
   - Log all errors with context
   - Handle nonce errors (concurrent requests)
   - Handle insufficient balance errors

2. **RPC Connection Errors**
   - Retry failed requests (max 3 attempts)
   - Fallback to alternative RPC if available
   - Return meaningful error messages

### Contract Deployment Errors

1. **Hardhat Node Not Running**
   - Check port availability before deployment
   - Display clear error message
   - Suggest running `pnpm chain` first

2. **Deployment Script Failures**
   - Log detailed error information
   - Clean up partial deployments
   - Provide recovery instructions

## Testing Strategy

### Unit Tests

1. **Frontend Components**
   - ChainSwitcher: Test chain selection and state updates
   - WalletSummary: Test balance display and formatting
   - Faucet: Test request flow and error handling
   - ChainProvider: Test chain switching logic
   - Balance hooks: Test data fetching and caching

2. **Backend Endpoints**
   - `/api/faucet`: Test validation, rate limiting, token transfers
   - `/api/config`: Test configuration response
   - Faucet rate limiter: Test cooldown logic

3. **Utility Functions**
   - Address formatting
   - Balance formatting
   - Explorer URL generation

### Integration Tests

1. **Local Development Flow**
   - Start Hardhat node
   - Deploy contracts
   - Sync environment variables
   - Start dev servers
   - Connect wallet
   - Request faucet tokens
   - Verify balances

2. **Chain Switching**
   - Switch from Sepolia to local
   - Verify wallet reconnection
   - Verify balance updates
   - Verify faucet availability

3. **Faucet End-to-End**
   - Request tokens
   - Wait for transaction confirmation
   - Verify balance increase
   - Test rate limiting

### Manual Testing Checklist

- [ ] Generate new project with CLI
- [ ] Run `pnpm install`
- [ ] Run `pnpm dev` (should start chain + deploy + dev servers)
- [ ] Connect wallet to local Hardhat
- [ ] Verify ETH and PYUSD balances display
- [ ] Request faucet tokens
- [ ] Verify balance increase
- [ ] Switch to Sepolia testnet
- [ ] Verify wallet reconnects
- [ ] Verify faucet button disappears
- [ ] Verify block explorer links work
- [ ] Deploy to Railway
- [ ] Verify production deployment works

## Deployment Architecture

### Local Development

```
┌─────────────────────────────────────────────────────────┐
│ Developer Machine                                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Hardhat Node │  │  API Server  │  │  Web Server  │ │
│  │  :8545       │  │  :4000       │  │  :5173       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Postgres    │  │    Redis     │                    │
│  │  :5432       │  │    :6379     │                    │
│  └──────────────┘  └──────────────┘                    │
│  (Docker Compose)                                       │
└─────────────────────────────────────────────────────────┘
```

### Railway Production

```
┌─────────────────────────────────────────────────────────┐
│ Railway Platform                                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  API Service │  │Worker Service│                    │
│  │  (Fastify)   │  │  (BullMQ)    │                    │
│  └──────────────┘  └──────────────┘                    │
│         │                  │                            │
│         └──────────────────┘                            │
│                    │                                    │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Postgres    │  │    Redis     │                    │
│  │  (Plugin)    │  │  (Plugin)    │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ Vercel / Railway Static                                 │
│  ┌──────────────┐                                       │
│  │  Web App     │                                       │
│  │  (Static)    │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Root `.env.example`

```bash
# Core Infrastructure
POSTGRES_URL=postgresql://makeabet:makeabet@localhost:5432/makeabet
REDIS_URL=redis://default:makeabet@localhost:6379

# PayPal Configuration
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Pyth Configuration
PYTH_PRICE_SERVICE_URL=https://hermes.pyth.network
PYTH_FEED_ID=

# Chain Configuration
TARGET_CHAIN=sepolia
CHAIN_TYPE=evm
EVM_CHAIN_ID=11155111
EVM_RPC_URL=https://ethereum-sepolia.publicnode.com
SOLANA_RPC_URL=

# PYUSD Addresses
PYUSD_CONTRACT_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
PYUSD_MINT_ADDRESS=

# Contract Addresses
MARKET_CONTRACT_ADDRESS=

# Local Chain Configuration
LOCAL_CHAIN_ENABLED=false
LOCAL_CHAIN_ID=31337
LOCAL_RPC_URL=http://127.0.0.1:8545
LOCAL_PYUSD_ADDRESS=
LOCAL_MARKET_ADDRESS=
LOCAL_FAUCET_ADDRESS=
LOCAL_FAUCET_PRIVATE_KEY=
LOCAL_FAUCET_ETH_AMOUNT=1
LOCAL_FAUCET_PYUSD_AMOUNT=100

# WalletConnect
WALLETCONNECT_PROJECT_ID=

# Features
ENABLE_MERCHANT_PORTAL=false
```

### Frontend `.env.example` (`apps/web/.env.example`)

```bash
# Chain Configuration
VITE_CHAIN_DEFAULT=sepolia
VITE_TARGET_CHAIN=sepolia
VITE_CHAIN_TYPE=evm

# EVM Configuration
VITE_EVM_CHAIN_ID=11155111
VITE_EVM_RPC_URL=https://ethereum-sepolia.publicnode.com
VITE_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# Solana Configuration
VITE_SOLANA_RPC_URL=
VITE_PYUSD_MINT=

# Local Chain Configuration
VITE_LOCAL_CHAIN_ENABLED=false
VITE_LOCAL_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_PYUSD_ADDRESS=

# Contract Addresses
VITE_MARKET_ADDRESS=

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=

# API
VITE_API_URL=http://localhost:4000
```

## Hardhat 3 Migration

### Current State (Hardhat 2)

The project currently uses Hardhat 2.x. To qualify for the Hardhat Builders Challenge, we must upgrade to Hardhat 3.0.0+.

### Migration Steps

1. **Update Dependencies**
   ```json
   {
     "hardhat": "^3.0.0",
     "@nomicfoundation/hardhat-toolbox": "^5.0.0",
     "@nomicfoundation/hardhat-ethers": "^3.0.0"
   }
   ```

2. **Update Hardhat Config**
   - Hardhat 3 uses a new configuration format
   - Update network configurations
   - Update plugin imports

3. **Update Scripts**
   - Ensure compatibility with ethers v6
   - Update deployment scripts
   - Update test scripts

4. **Test Migration**
   - Run `pnpm --filter @makeabet/contracts compile`
   - Run `pnpm --filter @makeabet/contracts test`
   - Verify local deployment works

### Hardhat 3 Features to Showcase

1. **Solidity Tests**
   - Add example `.t.sol` test files
   - Demonstrate Hardhat 3's native Solidity testing

2. **Improved Performance**
   - Leverage Rust-based components
   - Faster compilation and testing

3. **Multichain Support**
   - Configure multiple networks
   - Demonstrate deployment to different chains

## Pyth Integration

### Pull Oracle Pattern

The scaffold demonstrates Pyth's pull oracle pattern:

1. **Fetch Price Data from Hermes**
   ```typescript
   const priceIds = [process.env.PYTH_FEED_ID];
   const response = await fetch(
     `${process.env.PYTH_PRICE_SERVICE_URL}/api/latest_price_feeds?ids[]=${priceIds[0]}`
   );
   const data = await response.json();
   ```

2. **Update On-Chain Price**
   ```solidity
   bytes[] memory updateData = ...; // from Hermes
   uint fee = pyth.getUpdateFee(updateData);
   pyth.updatePriceFeeds{value: fee}(updateData);
   ```

3. **Consume Price**
   ```solidity
   PythStructs.Price memory price = pyth.getPriceNoOlderThan(
     priceId,
     60 // max age in seconds
   );
   ```

### Example Scripts

**Location:** `apps/contracts/scripts/updatePrice.ts` (already exists)

The scaffold includes example scripts demonstrating:
- Fetching price updates from Hermes
- Updating prices on-chain
- Reading prices from contracts
- Creating and settling prediction markets

## PYUSD Integration

### Mock PYUSD Contract

**Location:** `apps/contracts/contracts/MockPYUSD.sol` (already exists)

For local development, we deploy a mock ERC20 token that mimics PYUSD:
- 6 decimal places (same as real PYUSD)
- Mintable by owner (for faucet)
- Standard ERC20 interface

### Real PYUSD Addresses

**Sepolia:** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
**Arbitrum Sepolia:** `0xc6006A919685EA081697613373C50B6b46cd6F11`
**Solana Devnet:** `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`

### PYUSD Operations

The scaffold demonstrates:
1. **Balance Checking**
   - EVM: `balanceOf(address)` call
   - Solana: Token account balance query

2. **Transfers**
   - EVM: `transfer(to, amount)` transaction
   - Solana: Token transfer instruction

3. **Approvals** (EVM only)
   - `approve(spender, amount)` for contract interactions

## Railway Deployment

### Configuration Files

**`deploy/railway.json`** (already exists)
- Defines Postgres and Redis plugins
- Defines API and worker services
- Maps environment variables

**`Procfile`** (already exists)
```
web: pnpm --filter @makeabet/api start
worker: pnpm --filter @makeabet/worker start
```

### Deployment Flow

1. User clicks "Deploy on Railway" button in README
2. Railway creates new project from GitHub repo
3. Railway provisions Postgres and Redis plugins
4. Railway builds and deploys API and worker services
5. Railway injects database URLs automatically
6. User adds remaining environment variables (PayPal, Pyth, RPC URLs)
7. Services start and connect to databases

### Frontend Deployment

The frontend is deployed separately:
- **Option 1:** Vercel (recommended for React apps)
- **Option 2:** Railway Static Site
- **Option 3:** Netlify

Frontend must be configured with production API URL.

## Documentation Updates

### README Enhancements

1. **Quick Start Section**
   - Emphasize single command: `pnpm dev`
   - Explain what happens behind the scenes

2. **Local Development Section**
   - Document chain switching
   - Document faucet usage
   - Document environment variables

3. **Deployment Section**
   - Railway deployment steps
   - Frontend deployment options
   - Environment variable checklist

4. **Hackathon Section**
   - Hardhat 3 features used
   - PYUSD integration points
   - Pyth oracle usage

### Bilingual Documentation

Both `README.md` (English) and `README_TW.md` (Traditional Chinese) must be updated with:
- New workflow instructions
- Chain switching guide
- Faucet usage
- Deployment steps

### Hackathon Templates

**Location:** `docs/templates/`

Update templates for:
- Hardhat Builders Challenge
- PayPal USD prizes
- Pyth Network prizes

Include:
- Feature highlights
- Code snippets
- Demo video script
- Judging criteria alignment

## Security Considerations

1. **Faucet Security**
   - Only enable on local chain
   - Rate limit requests per address
   - Use dedicated faucet wallet (not deployer)
   - Limit transfer amounts

2. **Private Key Management**
   - Never commit private keys
   - Use `.env.local` for local keys
   - Document key generation process
   - Use Hardhat's default keys for local development

3. **RPC Endpoints**
   - Use public RPCs for testnets
   - Document rate limits
   - Provide fallback options
   - Consider Alchemy/Infura for production

4. **Environment Variables**
   - Validate all inputs
   - Provide sensible defaults
   - Document required vs optional
   - Use `.env.example` as template

## Performance Considerations

1. **Balance Queries**
   - Cache results with TanStack Query
   - Set appropriate stale time (30 seconds)
   - Debounce refetch requests
   - Handle RPC rate limits

2. **Chain Switching**
   - Minimize re-renders
   - Use React.memo for expensive components
   - Batch state updates
   - Clear stale data on switch

3. **Faucet Requests**
   - Show loading state immediately
   - Disable button during request
   - Implement client-side cooldown
   - Handle concurrent requests gracefully

4. **Build Optimization**
   - Use Turbo cache for monorepo builds
   - Minimize bundle size
   - Code split by route
   - Lazy load heavy components

## Future Enhancements

1. **Multi-Faucet Support**
   - Support faucets for multiple local chains
   - Add faucet for Solana local validator

2. **Enhanced Chain Metadata**
   - Add chain logos
   - Add gas price estimates
   - Add network status indicators

3. **Transaction History**
   - Store recent transactions
   - Show pending transactions
   - Link to block explorer

4. **Wallet Management**
   - Support multiple wallets
   - Wallet switching UI
   - Account abstraction support

5. **Developer Tools**
   - Contract interaction UI
   - Event log viewer
   - Gas profiler
   - Network debugger
