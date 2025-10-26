# Configuration Guide

## Environment Variables

### Web Application

Copy the example file and configure:

```bash
cd apps/web
cp .env.example .env.local
```

#### Required Configuration

**WalletConnect Project ID** (Recommended)

Get a free Project ID from [Reown Cloud](https://cloud.reown.com) (formerly WalletConnect):

1. Visit https://cloud.reown.com
2. Sign up / Log in
3. Create a new project
4. Copy your Project ID
5. Add to `.env.local`:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Example**:
```bash
VITE_WALLETCONNECT_PROJECT_ID=e7869a1d4f45f88710201aa2e74cb5c3
```

**Why is this needed?**
- Enables WalletConnect QR code scanning
- Supports 200+ mobile wallet apps
- Required for cross-device connections
- Free tier: 1M requests/month

**Without it**:
- ⚠️ Console warnings (can be ignored)
- ✅ Browser wallets (MetaMask) still work
- ❌ Mobile wallet scanning won't work

#### Auto-Configured (by deployment script)

These are automatically set when you run `pnpm dev`:

```bash
VITE_LOCAL_PYUSD_ADDRESS=     # Set by deploy-local.ts
VITE_MARKET_ADDRESS=          # Set by deploy-local.ts
```

### API Application

The API environment is also auto-configured:

```bash
cd apps/api
# .env.local is automatically created by sync-local-env.mjs
```

## Development Workflow

### 1. Start Development

```bash
# From monorepo root
pnpm dev
```

This will:
1. Start Hardhat node
2. Deploy contracts
3. Sync environment variables
4. Start API, Worker, and Web

### 2. Configure WalletConnect (Optional)

Add your Project ID to `apps/web/.env.local`:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Restart the web server:

```bash
# Stop pnpm dev (Ctrl+C)
pnpm dev
```

### 3. Verify Configuration

Open http://localhost:5173 and check:

- ✅ No console errors about "projectId"
- ✅ Can connect MetaMask
- ✅ Can see price feeds
- ✅ Can request faucet

## Production Configuration

### Environment Variables

For production deployment, set these in your hosting platform:

**Web (Vercel/Railway)**:
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_API_URL=https://your-api.railway.app
VITE_CHAIN_DEFAULT=sepolia
VITE_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

**API (Railway)**:
```bash
CHAIN_TYPE=evm
TARGET_CHAIN=sepolia
PYUSD_CONTRACT_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
EVM_RPC_URL=https://ethereum-sepolia.publicnode.com
```

## Troubleshooting

### WalletConnect Errors

**Error**: "projectId is required"

**Solution**: Add `VITE_WALLETCONNECT_PROJECT_ID` to `.env.local`

**Can I ignore it?**: Yes, for development. MetaMask will still work.

### Contract Addresses Not Set

**Error**: "Not configured" in UI

**Solution**: Run `pnpm deploy:local` to deploy contracts and sync environment

### Faucet 404 Error

**Error**: "Route POST:/faucet not found"

**Solution**: Ensure `LOCAL_CHAIN_ENABLED=true` in `apps/api/.env.local`

## Security Notes

### What to Commit

✅ **Commit**:
- `.env.example` files
- Configuration documentation
- Default values for local development

❌ **Never Commit**:
- `.env.local` files (in .gitignore)
- Production API keys
- Private keys
- Database credentials

### WalletConnect Project ID

- ✅ Safe to expose in frontend code
- ✅ Can be public (it's in the browser anyway)
- ✅ Rate-limited by Reown Cloud
- ❌ Don't share across multiple projects (create separate IDs)

## Additional Resources

- [WalletConnect Documentation](https://docs.reown.com)
- [Pyth Network Docs](https://docs.pyth.network)
- [Hardhat Configuration](https://hardhat.org/config)
