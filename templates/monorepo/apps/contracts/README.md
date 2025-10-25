# MakeABet Smart Contracts

This package contains the smart contracts for the MakeABet prediction market platform, built with **Hardhat 3** and Solidity 0.8.24.

## 🔨 Hardhat 3 Features

This project leverages Hardhat 3's latest capabilities:

- **Hardhat 3.0.0+**: Latest version with improved performance and developer experience
- **Native Solidity Testing**: Support for Forge-style `.t.sol` test files
- **Ethers v6**: Modern ethers.js integration with improved TypeScript support
- **Enhanced Toolbox**: Comprehensive testing and verification tools via `@nomicfoundation/hardhat-toolbox`
- **Optimized Compilation**: Faster builds with Rust-based components
- **IR-based Compilation**: Optional `viaIR` for advanced optimizations

## 📦 Contracts

### MakeABetMarket.sol

The main prediction market contract that integrates with Pyth Network oracles.

**Features:**
- Create prediction rooms with custom questions and price feeds
- Settle rooms using Pyth price data
- Event emission for room lifecycle tracking

### MockPYUSD.sol

A mock ERC20 token mimicking PayPal USD (PYUSD) for local development.

**Features:**
- 6 decimal places (matching real PYUSD)
- Mintable by owner for testing
- Standard ERC20 interface

## 🧪 Testing

This project includes both TypeScript and Solidity tests to demonstrate Hardhat 3's dual testing capabilities.

### TypeScript Tests (Mocha/Chai)

Traditional Hardhat tests using ethers.js:

```bash
pnpm test
```

Located in `test/MakeABetMarket.test.ts`

### Solidity Tests (Forge-style)

Native Solidity tests using Hardhat 3's built-in support:

```bash
pnpm test
```

Located in `test/MakeABetMarket.t.sol`

**Test Features:**
- Unit tests for contract deployment
- Room creation and validation tests
- PYUSD token functionality tests
- Fuzz testing examples
- Event emission verification

## 🚀 Deployment

### Local Development

Deploy to local Hardhat node:

```bash
pnpm deploy:local
```

This script:
1. Deploys MockPYUSD with initial supply
2. Deploys MakeABetMarket contract
3. Seeds faucet with 10,000 ETH and 1,000,000 PYUSD
4. Writes deployment artifacts to `deployments/local.json`

### Testnet Deployment

Deploy to Sepolia testnet:

```bash
pnpm deploy
```

Requires:
- `DEPLOYER_KEY` environment variable
- `ALCHEMY_SEPOLIA_URL` environment variable
- `PYTH_CONTRACT_ADDRESS` environment variable

## 📝 Scripts

### Create Room

Create a new prediction room:

```bash
MARKET_CONTRACT_ADDRESS=0x... \
ROOM_QUESTION="Will ETH reach $5000?" \
PYTH_FEED_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace \
ROOM_EXPIRY=1735689600 \
pnpm createRoom
```

### Update Price

Fetch latest price from Pyth Hermes:

```bash
MARKET_CONTRACT_ADDRESS=0x... \
PYTH_FEED_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace \
pnpm updatePrice
```

### Settle Room

Settle a prediction room with Pyth price data:

```bash
MARKET_CONTRACT_ADDRESS=0x... \
PYTH_FEED_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace \
ROOM_ID=0 \
TARGET_PRICE=200000000000 \
UPDATE_FEE_WEI=1 \
pnpm settleRoom
```

## 🔧 Configuration

### hardhat.config.ts

Key configuration options:

```typescript
{
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
      viaIR: true  // Advanced IR-based optimization
    }
  }
}
```

### Networks

Configured networks:
- **hardhat**: Local development (chainId: 31337)
- **localhost**: Local Hardhat node (chainId: 31337)
- **sepolia**: Ethereum testnet (chainId: 11155111)
- **arbitrum-sepolia**: Arbitrum testnet (chainId: 421614)
- **base-sepolia**: Base testnet (chainId: 84532)

## 🏆 Hackathon Prize Eligibility

This contracts package demonstrates features for multiple ETHGlobal prizes:

### Hardhat Builders Challenge ✅

- Uses Hardhat 3.0.0+
- Includes Solidity tests (`.t.sol`)
- Demonstrates TypeScript tests
- Uses latest ethers v6 integration
- Showcases advanced compilation options

### PayPal USD Integration ✅

- MockPYUSD contract with 6 decimals
- ERC20 standard implementation
- Minting and transfer functionality
- Faucet integration for testing

### Pyth Network Integration ✅

- Pull oracle pattern implementation
- Hermes API integration
- On-chain price feed updates
- Price consumption in smart contracts

## 📚 Additional Resources

- [Hardhat 3 Documentation](https://hardhat.org/)
- [Ethers v6 Documentation](https://docs.ethers.org/v6/)
- [Pyth Network Documentation](https://docs.pyth.network/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🔐 Security

- Never commit private keys
- Use `.env.local` for sensitive data
- Audit contracts before mainnet deployment
- Test thoroughly on testnets first

## 📄 License

MIT
