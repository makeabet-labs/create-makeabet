# Requirements Document

## Introduction

This document defines the requirements for enhancing the `create-makeabet` scaffold to provide a complete development experience for ETHGlobal hackathon participants. The enhancements focus on seamless local development with Hardhat 3, chain switching capabilities, PYUSD integration, Pyth oracle support, and Railway deployment automation. The scaffold must enable developers to quickly bootstrap a production-ready Web3 application that qualifies for Hardhat, PayPal USD, and Pyth Network prizes.

## Glossary

- **Scaffold System**: The `create-makeabet` CLI tool and generated project templates
- **Chain Provider**: React context that manages active blockchain network state and metadata
- **Wallet Provider**: Component that configures wallet connections for EVM and Solana chains
- **Faucet Service**: Backend API endpoint that distributes test tokens on local networks
- **Local Chain**: Hardhat node running on localhost:8545
- **Deployment Artifacts**: JSON files containing deployed contract addresses and ABIs
- **Chain Switcher**: UI component allowing users to toggle between networks
- **Block Explorer**: External service for viewing blockchain transactions and addresses

## Requirements

### Requirement 1: Chain Management System

**User Story:** As a developer, I want to seamlessly switch between local Hardhat and testnets, so that I can develop locally and test on real networks without manual configuration.

#### Acceptance Criteria

1. WHEN the Scaffold System initializes, THE Chain Provider SHALL load the default chain configuration from environment variables
2. THE Chain Provider SHALL expose chain metadata including chain ID, RPC URL, block explorer URL, and PYUSD contract address
3. WHEN a user selects a different chain via the Chain Switcher, THE Chain Provider SHALL update the active chain state
4. WHEN the active chain changes, THE Wallet Provider SHALL rebuild wallet configuration to match the selected chain type (EVM or Solana)
5. THE Scaffold System SHALL support local-hardhat, Sepolia, Arbitrum Sepolia, and Solana Devnet networks

### Requirement 2: Local Development Automation

**User Story:** As a developer, I want to run a single command to start my entire development environment, so that I can begin coding immediately without manual setup steps.

#### Acceptance Criteria

1. WHEN a developer executes `pnpm chain`, THE Scaffold System SHALL start a Hardhat node on 0.0.0.0:8545
2. WHEN a developer executes `pnpm deploy:local`, THE Scaffold System SHALL deploy mock PYUSD and MakeABetMarket contracts to the Local Chain
3. WHEN local deployment completes, THE Scaffold System SHALL write Deployment Artifacts to `deployments/local.json`
4. WHEN local deployment completes, THE Scaffold System SHALL update environment files with deployed contract addresses
5. WHEN a developer executes `pnpm dev`, THE Scaffold System SHALL start the Local Chain, wait for port 8545 availability, deploy contracts, synchronize environment variables, and start all development servers
6. IF the Local Chain is already running, THE Scaffold System SHALL detect the existing process and skip chain startup

### Requirement 3: Wallet and Balance Display

**User Story:** As a user, I want to see my native token and PYUSD balances with clear status indicators, so that I can verify my wallet state before making transactions.

#### Acceptance Criteria

1. WHEN a wallet is connected, THE Scaffold System SHALL display the native token balance with loading, success, and error states
2. WHEN a wallet is connected, THE Scaffold System SHALL display the PYUSD token balance with loading, success, and error states
3. WHEN balance data is unavailable, THE Scaffold System SHALL display an appropriate error message
4. THE Scaffold System SHALL refresh balances when the active chain changes
5. THE Scaffold System SHALL refresh balances when a transaction completes

### Requirement 4: Block Explorer Integration

**User Story:** As a user, I want to view my transactions and addresses on block explorers, so that I can verify on-chain activity and debug issues.

#### Acceptance Criteria

1. THE Scaffold System SHALL provide deep links to Block Explorer for the connected wallet address
2. THE Scaffold System SHALL provide deep links to Block Explorer for transaction hashes
3. WHEN the active chain changes, THE Scaffold System SHALL update Block Explorer URLs to match the new chain
4. WHERE the Local Chain is active, THE Scaffold System SHALL disable Block Explorer links or display a message indicating no explorer is available

### Requirement 5: Local Faucet System

**User Story:** As a developer, I want to request test tokens from a local faucet, so that I can test transactions without needing external testnet faucets.

#### Acceptance Criteria

1. WHEN local contracts are deployed, THE Scaffold System SHALL seed a faucet signer wallet with 10000 ETH and 1000000 PYUSD
2. WHILE the Local Chain is active, THE Faucet Service SHALL accept requests at `/api/faucet` endpoint
3. WHEN a valid faucet request is received, THE Faucet Service SHALL transfer 1 ETH and 100 PYUSD to the requesting address
4. WHEN a faucet request completes, THE Faucet Service SHALL return transaction hashes and success status
5. WHERE the active chain is not local-hardhat, THE Faucet Service SHALL return an error indicating faucets are only available on local networks
6. WHILE on the Local Chain with a connected wallet, THE Scaffold System SHALL display a "Request Faucet" button
7. WHEN a faucet request completes, THE Scaffold System SHALL display a toast notification with the result

### Requirement 6: Environment Configuration

**User Story:** As a developer, I want clear environment variable examples and automatic synchronization, so that I can configure my application correctly without manual file editing.

#### Acceptance Criteria

1. THE Scaffold System SHALL provide `.env.example` files with all required variables documented
2. THE Scaffold System SHALL include local chain configuration variables: `LOCAL_CHAIN_ENABLED`, `LOCAL_RPC_URL`, `LOCAL_PYUSD_ADDRESS`, `LOCAL_MARKET_ADDRESS`
3. THE Scaffold System SHALL include frontend configuration variables: `VITE_CHAIN_DEFAULT`, `VITE_LOCAL_RPC_URL`, `VITE_LOCAL_PYUSD_ADDRESS`
4. WHEN local deployment completes, THE Scaffold System SHALL execute a synchronization script that updates `.env.local` and `apps/web/.env.local` with deployed addresses
5. THE Scaffold System SHALL exclude generated Deployment Artifacts from version control via `.gitignore`

### Requirement 7: Hardhat 3 Compliance

**User Story:** As a hackathon participant, I want to use Hardhat 3 features, so that my project qualifies for the Hardhat Builders Challenge prize.

#### Acceptance Criteria

1. THE Scaffold System SHALL use Hardhat version 3.0.0 or higher
2. THE Scaffold System SHALL configure Hardhat with Solidity 0.8.24 or higher
3. THE Scaffold System SHALL provide deployment scripts using ethers v6 API
4. THE Scaffold System SHALL include example Solidity tests demonstrating Hardhat 3 testing capabilities
5. THE Scaffold System SHALL document Hardhat 3 usage in the generated README

### Requirement 8: PYUSD Integration

**User Story:** As a hackathon participant, I want to integrate PYUSD token functionality, so that my project qualifies for PayPal USD prizes.

#### Acceptance Criteria

1. THE Scaffold System SHALL deploy a mock PYUSD ERC20 token contract on the Local Chain
2. THE Scaffold System SHALL configure PYUSD contract addresses for Sepolia and Arbitrum Sepolia testnets
3. THE Scaffold System SHALL provide utility functions for checking PYUSD balances
4. THE Scaffold System SHALL provide utility functions for transferring PYUSD tokens
5. THE Scaffold System SHALL display PYUSD balances in the frontend dashboard

### Requirement 9: Pyth Oracle Integration

**User Story:** As a hackathon participant, I want to use Pyth price feeds via pull oracle pattern, so that my project qualifies for Pyth Network prizes.

#### Acceptance Criteria

1. THE Scaffold System SHALL include example code for fetching price data from Pyth Hermes API
2. THE Scaffold System SHALL include example code for updating price feeds on-chain using `updatePriceFeeds` method
3. THE Scaffold System SHALL include example code for consuming price data from Pyth contracts
4. THE Scaffold System SHALL configure Pyth price feed IDs in environment variables
5. THE Scaffold System SHALL document Pyth integration steps in the generated README

### Requirement 10: Railway Deployment

**User Story:** As a developer, I want to deploy my application to Railway with one click, so that I can share a live demo without manual infrastructure setup.

#### Acceptance Criteria

1. THE Scaffold System SHALL provide a `railway.json` configuration file defining all services
2. THE Scaffold System SHALL configure Railway to provision Postgres and Redis plugins automatically
3. THE Scaffold System SHALL define a `Procfile` that starts API and worker services
4. THE Scaffold System SHALL include a "Deploy on Railway" button in the generated README
5. THE Scaffold System SHALL document required environment variables for Railway deployment
6. WHEN deployed to Railway, THE Scaffold System SHALL use production RPC endpoints and disable local-only features

### Requirement 11: Documentation and Templates

**User Story:** As a developer, I want comprehensive documentation and examples, so that I can understand how to use all scaffold features.

#### Acceptance Criteria

1. THE Scaffold System SHALL generate a README with quick start instructions
2. THE Scaffold System SHALL generate a README with local development workflow documentation
3. THE Scaffold System SHALL generate a README with chain switching instructions
4. THE Scaffold System SHALL generate a README with faucet usage instructions
5. THE Scaffold System SHALL generate a README with Railway deployment instructions
6. THE Scaffold System SHALL provide bilingual documentation in English and Traditional Chinese
7. THE Scaffold System SHALL include hackathon briefing templates for Hardhat, PYUSD, and Pyth prizes

### Requirement 12: Chain Switcher UI Component

**User Story:** As a user, I want a clear UI to switch between networks, so that I can easily test my application on different chains.

#### Acceptance Criteria

1. THE Chain Switcher SHALL display the currently active chain name and icon
2. THE Chain Switcher SHALL provide a dropdown or modal listing all available chains
3. WHEN a user selects a different chain, THE Chain Switcher SHALL trigger the Chain Provider to update state
4. THE Chain Switcher SHALL indicate when a chain switch is in progress
5. THE Chain Switcher SHALL display an error message if chain switching fails
