# create-makeabet

`create-makeabet` is the official scaffold generator for the MakeABet hackathon stack. It bootstraps a Turbo monorepo that is ready for the **Hardhat 3 Builders Challenge**, **PayPal USD (PYUSD)** prizes, and **Pyth Network** integration.

## Features

✨ **Hardhat 3** - Latest Hardhat with Solidity tests, Rust-based performance, and multichain support  
💵 **PYUSD Integration** - Mock PYUSD for local dev, real PYUSD addresses for Sepolia/Arbitrum  
🔮 **Pyth Oracle** - Pull oracle pattern with Hermes integration and example scripts  
🚀 **One-Command Dev** - `pnpm dev` starts everything: chain, deployment, sync, and servers  
🔄 **Chain Switching** - Seamlessly switch between local Hardhat, Sepolia, Arbitrum, and Solana  
💧 **Local Faucet** - Request test ETH and PYUSD instantly on local network  
☁️ **Railway Ready** - One-click deployment with Postgres and Redis auto-provisioned

## Prerequisites

- **Node.js 22+** (22.10.0 or higher) - **Required for Hardhat 3**
- **pnpm 9+**
- **Git**
- **Docker** (for local Postgres/Redis)
- **Railway account** (optional, for deployment)

> 💡 **Important**: Hardhat 3 requires Node.js 22 or higher. Use `nvm use 22` or `fnm use 22` to switch versions.

## Quick Start (local CLI)

```bash
# Clone and install once
git clone <repo-url> create-makeabet
cd create-makeabet
pnpm install

# Build the CLI
pnpm --filter @makeabet/create build

# Generate a new project (interactive prompts)
node packages/create-makeabet/dist/cli.js my-makeabet-app
```

## Usage Options

You can also pass arguments to skip prompts:

```bash
node packages/create-makeabet/dist/cli.js my-app \
  --merchant \
  --chain sepolia \
  --package-manager pnpm
```

Flags:
- `--merchant` / `-m` – keep the merchant portal module (omit to remove it)
- `--chain <sepolia|arbitrum-sepolia|solana-devnet>` – default `sepolia`
- `--package-manager <pnpm|npm|yarn>` – default `pnpm`

## Scaffold Contents

The generated workspace contains:

- `apps/contracts` – **Hardhat 3** with Solidity tests, Pyth pull-oracle scripts, and PYUSD mock contracts
- `apps/api` – Fastify 5 API with Prisma, PayPal/Pyth endpoints, and local faucet service
- `apps/worker` – BullMQ worker for price updates and settlements
- `apps/web` – Vite + React 19 SPA with chain switching, wallet summary, and PYUSD balance display
- `docker-compose.yml` & `Makefile` – Postgres/Redis dev stack and helper commands
- `deploy/railway.json` & `Procfile` – turn-key Railway deployment template
- `docs/prizes/*` – Hackathon briefing templates (Hardhat/PYUSD/Pyth focus)

Merchant-specific stubs live under `apps/web/src/modules/merchant` and `apps/api/src/modules/merchant`. When the CLI is run without `--merchant`, these folders (and docs) are removed automatically.

## Working With a Generated Project

### 🚀 Single-Command Development (Recommended)

The fastest way to get started is with one command:

```bash
cd my-makeabet-app
pnpm install
docker compose up -d    # start Postgres & Redis
pnpm dev
```

**What happens behind the scenes:**

1. **Starts Hardhat Node** - Local blockchain on `localhost:8545`
2. **Waits for Port** - Ensures Hardhat is ready before proceeding
3. **Deploys Contracts** - Deploys MockPYUSD and MakeABetMarket contracts
4. **Syncs Environment** - Updates `.env.local` files with deployed addresses
5. **Starts All Services** - API (port 4000), Worker, and Web (port 5173) concurrently

Your local development environment is now fully configured and running!

### 🔗 Chain Switching

The scaffold supports multiple networks out of the box:

- **Local Hardhat** (31337) - For fast local development with instant transactions
- **Sepolia** (11155111) - Ethereum testnet with real PYUSD
- **Arbitrum Sepolia** (421614) - L2 testnet with lower fees
- **Solana Devnet** - Solana testnet with SPL PYUSD

**To switch chains:**

1. Open the web app at `http://localhost:5173`
2. Click the chain selector in the header
3. Select your desired network
4. Your wallet will automatically reconnect

The UI adapts based on the selected chain:
- Block explorer links update automatically
- PYUSD contract addresses change per network
- Faucet button only appears on local Hardhat

### 💧 Local Faucet Usage

When connected to the local Hardhat network, you can request test tokens instantly:

1. Connect your wallet to the local network
2. Click the **"Request Faucet"** button in the Wallet Summary
3. Receive **1 ETH** and **100 PYUSD** immediately
4. Balances update automatically

**Rate Limiting:** One request per address every 5 minutes.

**Faucet Configuration:**

You can customize faucet amounts in `.env`:

```bash
LOCAL_FAUCET_ETH_AMOUNT=1      # ETH per request
LOCAL_FAUCET_PYUSD_AMOUNT=100  # PYUSD per request
```

### 🔧 Manual Development Steps

If you prefer to run services individually:

```bash
# Terminal 1: Start Hardhat node
pnpm chain

# Terminal 2: Deploy contracts to local chain
pnpm deploy:local

# Terminal 3: Sync environment variables
pnpm sync:local-env

# Terminal 4: Start all dev servers
pnpm --filter @makeabet/api dev
pnpm --filter @makeabet/worker dev
pnpm --filter @makeabet/web dev
```

### 🔨 Hardhat 3 Tasks

The scaffold uses **Hardhat 3.0.0+** to qualify for the Hardhat Builders Challenge:

```bash
# Compile contracts (Solidity 0.8.24+)
pnpm --filter @makeabet/contracts compile

# Run TypeScript tests
pnpm --filter @makeabet/contracts test

# Run Solidity tests (Hardhat 3 feature)
pnpm --filter @makeabet/contracts test:sol

# Deploy to Sepolia
pnpm --filter @makeabet/contracts run scripts/deploy.ts --network sepolia
```

**Hardhat 3 Features Used:**
- ✅ Solidity tests (`.t.sol` files)
- ✅ Rust-based performance improvements
- ✅ Multichain support (EVM + Solana)
- ✅ Modern ethers v6 API
- ✅ Improved CLI and plugin system

See `apps/contracts/README.md` for detailed Hardhat 3 documentation.

### 💵 PYUSD Integration

The scaffold includes full PYUSD support:

**Local Development:**
- Mock PYUSD ERC20 contract deployed automatically
- 6 decimal places (matches real PYUSD)
- Faucet pre-loaded with 1,000,000 PYUSD

**Testnet Addresses:**
- **Sepolia:** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- **Arbitrum Sepolia:** `0xc6006A919685EA081697613373C50B6b46cd6F11`
- **Solana Devnet:** `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`

**Usage Examples:**

```typescript
// Check PYUSD balance (React hook)
import { usePYUSDBalance } from '@/wallet/hooks';

const { balance, formatted, isLoading } = usePYUSDBalance(address);

// Transfer PYUSD (ethers v6)
const pyusd = new ethers.Contract(pyusdAddress, ERC20_ABI, signer);
await pyusd.transfer(recipient, ethers.parseUnits('100', 6));
```

See the **PYUSD Integration Guide** section below for more details.

### 🔮 Pyth Oracle Integration

The scaffold demonstrates Pyth's pull oracle pattern:

**Example Scripts:**
- `scripts/updatePrice.ts` - Fetch from Hermes and update on-chain
- `scripts/createRoom.ts` - Create prediction market with Pyth price feed
- `scripts/settleRoom.ts` - Settle market using Pyth price

**Pull Oracle Flow:**

```typescript
// 1. Fetch price data from Hermes
const priceIds = [process.env.PYTH_FEED_ID];
const response = await fetch(
  `${process.env.PYTH_PRICE_SERVICE_URL}/api/latest_price_feeds?ids[]=${priceIds[0]}`
);
const data = await response.json();

// 2. Update price on-chain
const updateData = data.binary.data.map(hex => '0x' + hex);
const fee = await pyth.getUpdateFee(updateData);
await pyth.updatePriceFeeds(updateData, { value: fee });

// 3. Consume price
const price = await pyth.getPriceNoOlderThan(priceId, 60);
```

See the **Pyth Oracle Guide** section below for more details.

### 📝 Environment Configuration

Copy `.env.example` to `.env` and fill in required values:

**Required for Local Development:**
```bash
# Database (auto-configured by docker-compose)
POSTGRES_URL=postgresql://makeabet:makeabet@localhost:5432/makeabet
REDIS_URL=redis://default:makeabet@localhost:6379

# Local chain (auto-configured by pnpm dev)
LOCAL_CHAIN_ENABLED=true
LOCAL_RPC_URL=http://127.0.0.1:8545
```

**Required for Testnet/Production:**
```bash
# PayPal (get from developer.paypal.com)
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret

# Pyth (use defaults or customize)
PYTH_PRICE_SERVICE_URL=https://hermes.pyth.network
PYTH_FEED_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace

# RPC URLs (use public or Alchemy/Infura)
EVM_RPC_URL=https://ethereum-sepolia.publicnode.com
SOLANA_RPC_URL=https://api.devnet.solana.com

# PYUSD Addresses (pre-configured for testnets)
PYUSD_CONTRACT_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

# WalletConnect (get from cloud.walletconnect.com)
WALLETCONNECT_PROJECT_ID=your_project_id
```

**Auto-Synced Variables:**

When you run `pnpm dev` or `pnpm sync:local-env`, these variables are automatically updated:
- `LOCAL_PYUSD_ADDRESS` - Deployed mock PYUSD address
- `LOCAL_MARKET_ADDRESS` - Deployed market contract address
- `VITE_LOCAL_PYUSD_ADDRESS` - Frontend copy of PYUSD address

### ☁️ Railway Deployment

Deploy your project to production in minutes:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

**Deployment Steps:**

1. **Prepare Your Project**
   ```bash
   # Ensure all environment variables are documented
   cp .env.example .env
   # Fill in production values (PayPal, Pyth, RPC URLs)
   ```

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Deploy to Railway**
   - Click the "Deploy on Railway" button above (or create a new project manually)
   - Connect your GitHub repository
   - Railway automatically:
     - Provisions **Postgres** database
     - Provisions **Redis** instance
     - Creates **API** service (Fastify)
     - Creates **Worker** service (BullMQ)
     - Injects database URLs via `${{postgres.DATABASE_URL}}` and `${{redis.REDIS_URL}}`

4. **Configure Environment Variables**
   
   Add these variables in Railway dashboard:
   
   ```bash
   # PayPal
   PAYPAL_CLIENT_ID=<your_production_client_id>
   PAYPAL_CLIENT_SECRET=<your_production_secret>
   
   # Pyth
   PYTH_PRICE_SERVICE_URL=https://hermes.pyth.network
   PYTH_FEED_ID=<your_feed_id>
   
   # Chain Configuration
   TARGET_CHAIN=sepolia
   CHAIN_TYPE=evm
   EVM_CHAIN_ID=11155111
   EVM_RPC_URL=<your_alchemy_or_infura_url>
   
   # PYUSD
   PYUSD_CONTRACT_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
   
   # WalletConnect
   WALLETCONNECT_PROJECT_ID=<your_project_id>
   
   # Disable local-only features
   LOCAL_CHAIN_ENABLED=false
   ```

5. **Deploy Frontend**
   
   Deploy the web app separately to Vercel or Railway Static:
   
   **Vercel:**
   ```bash
   cd apps/web
   vercel --prod
   ```
   
   **Railway Static:**
   - Create a new Railway service
   - Set build command: `pnpm --filter @makeabet/web build`
   - Set output directory: `apps/web/dist`
   
   Configure frontend environment variables:
   ```bash
   VITE_API_URL=<your_railway_api_url>
   VITE_TARGET_CHAIN=sepolia
   VITE_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
   VITE_WALLETCONNECT_PROJECT_ID=<your_project_id>
   ```

6. **Verify Deployment**
   - Check API health: `https://your-api.railway.app/api/health`
   - Check worker logs in Railway dashboard
   - Test frontend connection to API
   - Verify database migrations ran successfully

**Railway Configuration Files:**

- `deploy/railway.json` - Defines services and plugins
- `Procfile` - Defines start commands for each service
- `turbo.json` - Configures build pipeline

**Troubleshooting:**

- **Build fails:** Check Node.js version (should be 20+)
- **Database connection fails:** Verify `DATABASE_URL` is injected
- **API won't start:** Check logs for missing environment variables
- **Worker not processing jobs:** Verify Redis connection

## Hardhat 3 Integration Guide

This scaffold uses **Hardhat 3.0.0+** to qualify for the Hardhat Builders Challenge prize.

### Key Features

**Solidity Tests:**
```solidity
// test/MakeABetMarket.t.sol
contract MakeABetMarketTest is Test {
    function testCreateRoom() public {
        // Native Solidity testing with Hardhat 3
    }
}
```

**Performance Improvements:**
- Rust-based compilation (faster builds)
- Optimized test execution
- Improved caching

**Multichain Support:**
- Configure multiple networks in `hardhat.config.ts`
- Deploy to EVM chains and Solana
- Network-specific configurations

**Modern API:**
- ethers v6 integration
- Improved TypeScript support
- Better error messages

### Running Tests

```bash
# TypeScript tests
pnpm --filter @makeabet/contracts test

# Solidity tests (Hardhat 3 feature)
pnpm --filter @makeabet/contracts test:sol

# With coverage
pnpm --filter @makeabet/contracts coverage
```

### Deployment

```bash
# Local
pnpm deploy:local

# Sepolia
pnpm --filter @makeabet/contracts run scripts/deploy.ts --network sepolia

# Arbitrum Sepolia
pnpm --filter @makeabet/contracts run scripts/deploy.ts --network arbitrumSepolia
```

See `apps/contracts/README.md` for complete Hardhat 3 documentation.

## PYUSD Integration Guide

### Contract Addresses

**Testnets:**
- **Ethereum Sepolia:** `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- **Arbitrum Sepolia:** `0xc6006A919685EA081697613373C50B6b46cd6F11`
- **Solana Devnet:** `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`

**Local Development:**
- Mock PYUSD deployed automatically via `pnpm dev`
- Address stored in `LOCAL_PYUSD_ADDRESS` environment variable

### Checking Balances

**Frontend (React):**
```typescript
import { usePYUSDBalance } from '@/wallet/hooks';

function WalletDisplay() {
  const { address } = useAccount();
  const { balance, formatted, isLoading, error } = usePYUSDBalance(address);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Text>Error loading balance</Text>;
  
  return <Text>{formatted} PYUSD</Text>;
}
```

**Backend (Node.js):**
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);
const pyusd = new ethers.Contract(
  process.env.PYUSD_CONTRACT_ADDRESS,
  ['function balanceOf(address) view returns (uint256)'],
  provider
);

const balance = await pyusd.balanceOf(address);
const formatted = ethers.formatUnits(balance, 6); // PYUSD has 6 decimals
```

### Transferring PYUSD

**Frontend:**
```typescript
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';

const { writeContract } = useWriteContract();

await writeContract({
  address: pyusdAddress,
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: [recipient, parseUnits('100', 6)], // 100 PYUSD
});
```

**Smart Contract:**
```solidity
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyContract {
    IERC20 public pyusd;
    
    constructor(address _pyusd) {
        pyusd = IERC20(_pyusd);
    }
    
    function acceptPayment(uint256 amount) external {
        pyusd.transferFrom(msg.sender, address(this), amount);
    }
}
```

### Approvals

Before a contract can transfer PYUSD on your behalf, you must approve it:

```typescript
// Frontend
await writeContract({
  address: pyusdAddress,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [contractAddress, parseUnits('1000', 6)], // Approve 1000 PYUSD
});

// Then call contract function
await writeContract({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'acceptPayment',
  args: [parseUnits('100', 6)],
});
```

## Pyth Oracle Guide

This scaffold demonstrates Pyth's **pull oracle pattern** for on-chain price feeds.

### Pull Oracle Pattern

Unlike traditional push oracles, Pyth uses a pull model:

1. **Fetch** price data from Hermes API (off-chain)
2. **Update** price on-chain by submitting the data
3. **Consume** the updated price in your contract

This approach is more gas-efficient and provides fresher data.

### Fetching from Hermes

```typescript
// Fetch latest price update
const priceIds = [
  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' // ETH/USD
];

const response = await fetch(
  `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceIds[0]}`
);

const data = await response.json();
const updateData = data.binary.data.map(hex => '0x' + hex);
```

### Updating On-Chain

```typescript
import { ethers } from 'ethers';

const pyth = new ethers.Contract(pythAddress, PYTH_ABI, signer);

// Get update fee
const fee = await pyth.getUpdateFee(updateData);

// Update price feeds
const tx = await pyth.updatePriceFeeds(updateData, { value: fee });
await tx.wait();
```

### Consuming Prices

**In Smart Contracts:**
```solidity
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract MyContract {
    IPyth pyth;
    bytes32 ethUsdPriceId;
    
    constructor(address _pyth, bytes32 _priceId) {
        pyth = IPyth(_pyth);
        ethUsdPriceId = _priceId;
    }
    
    function getLatestPrice() public view returns (int64) {
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            ethUsdPriceId,
            60 // Max age: 60 seconds
        );
        return price.price;
    }
    
    function updateAndGetPrice(bytes[] calldata updateData) 
        external 
        payable 
        returns (int64) 
    {
        // Update price (requires fee)
        uint fee = pyth.getUpdateFee(updateData);
        pyth.updatePriceFeeds{value: fee}(updateData);
        
        // Get updated price
        PythStructs.Price memory price = pyth.getPrice(ethUsdPriceId);
        return price.price;
    }
}
```

**In Frontend:**
```typescript
// Read price (no transaction)
const price = await pythContract.getPriceNoOlderThan(priceId, 60);
console.log('Price:', price.price);
console.log('Confidence:', price.conf);
console.log('Expo:', price.expo);

// Calculate human-readable price
const humanPrice = Number(price.price) * Math.pow(10, price.expo);
```

### Price Feed IDs

Common price feeds for hackathons:

- **ETH/USD:** `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **BTC/USD:** `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **SOL/USD:** `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`

Find more at: https://pyth.network/developers/price-feed-ids

### Example Scripts

The scaffold includes working examples:

```bash
# Update ETH/USD price on local chain
pnpm --filter @makeabet/contracts run scripts/updatePrice.ts

# Create prediction market with Pyth feed
pnpm --filter @makeabet/contracts run scripts/createRoom.ts

# Settle market using Pyth price
pnpm --filter @makeabet/contracts run scripts/settleRoom.ts
```

## Development Notes

- The CLI code lives in `packages/create-makeabet`. Run `pnpm --filter @makeabet/create dev` for watch mode.
- Template files live in `templates/monorepo`. Adjust them before building/publishing the CLI.
- Keep the CLI up to date with your hackathon progress (e.g., add new scripts or docs as the product evolves).

## Prize Qualification Checklist

### ✅ Hardhat Builders Challenge

- [x] Uses Hardhat 3.0.0+
- [x] Includes Solidity tests (`.t.sol` files)
- [x] Demonstrates Hardhat 3 features
- [x] Documented in README

### ✅ PayPal USD Prizes

- [x] Integrates PYUSD token
- [x] Supports multiple chains (Sepolia, Arbitrum, Solana)
- [x] Includes balance checking and transfers
- [x] Documented with code examples

### ✅ Pyth Network Prizes

- [x] Uses pull oracle pattern
- [x] Fetches from Hermes API
- [x] Updates prices on-chain
- [x] Consumes prices in contracts
- [x] Documented with examples

## Resources

- **Hardhat 3 Docs:** https://hardhat.org/docs/getting-started
- **PYUSD Developer Resources:** https://linktr.ee/pyusd_dev
- **Pyth EVM Guide:** https://docs.pyth.network/price-feeds/use-real-time-data/evm
- **Pyth Price Feeds:** https://pyth.network/developers/price-feed-ids
- **Railway Docs:** https://docs.railway.app

## Support

For questions or issues:
- Open an issue on GitHub
- Check `docs/` for detailed guides
- Review example scripts in `apps/contracts/scripts/`

## License

MIT
