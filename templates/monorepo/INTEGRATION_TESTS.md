# Integration Tests

This document describes the comprehensive integration test suite for the MakeABet scaffold.

## Overview

The integration tests validate the complete local development workflow, chain switching functionality, and faucet system. Tests are organized by application layer and use appropriate testing frameworks:

- **Web App**: Vitest with jsdom environment
- **API**: Vitest with Node environment  
- **Contracts**: Hardhat with Chai matchers

## Test Structure

```
templates/monorepo/
├── apps/
│   ├── web/src/test/
│   │   ├── setup.ts
│   │   ├── integration/
│   │   │   ├── chain-switching.test.ts
│   │   │   ├── faucet.test.ts
│   │   │   └── local-dev-flow.test.ts
│   │   └── README.md
│   ├── api/src/test/
│   │   ├── setup.ts
│   │   ├── integration/
│   │   │   └── faucet-api.test.ts
│   │   └── README.md
│   └── contracts/test/
│       ├── integration/
│       │   ├── LocalDeployment.test.ts
│       │   └── README.md
│       ├── MakeABetMarket.test.ts
│       └── MakeABetMarket.t.sol
└── scripts/
    └── test-integration.mjs
```

## Running Tests

### Run all integration tests
```bash
pnpm test:integration
```

This runs the comprehensive integration test script that:
1. Validates deployment artifacts
2. Checks environment synchronization
3. Runs contract tests
4. Runs web tests
5. Runs API tests

### Run tests by application

```bash
# Web tests
pnpm --filter @makeabet/web test

# API tests
pnpm --filter @makeabet/api test

# Contract tests
pnpm --filter @makeabet/contracts test
```

### Run specific test files

```bash
# Chain switching tests
pnpm --filter @makeabet/web exec vitest run chain-switching

# Faucet tests
pnpm --filter @makeabet/web exec vitest run faucet

# Local development flow tests
pnpm --filter @makeabet/web exec vitest run local-dev-flow

# API faucet tests
pnpm --filter @makeabet/api exec vitest run faucet-api

# Contract deployment tests
pnpm --filter @makeabet/contracts test test/integration
```

## Test Coverage

### Web Integration Tests (28 tests)

#### Chain Switching (8 tests)
- Store and retrieve selected chain from localStorage
- Handle chain switches between different networks
- Clear chain-specific data when switching
- Validate chain metadata structure
- Support both EVM and Solana chains
- Handle invalid chain keys gracefully

**Requirements Tested:** 3.4 - Balance refresh on chain change

#### Faucet (10 tests)
- Allow faucet requests when no previous request exists
- Block requests within cooldown period (5 minutes)
- Allow requests after cooldown period
- Calculate remaining cooldown time correctly
- Handle multiple addresses independently
- Validate request/response structures
- Handle error responses (rate limit, network errors)
- Clear faucet timestamp on chain switch
- Validate Ethereum address format

**Requirements Tested:** 5.7 - Faucet request flow and notifications

#### Local Development Flow (10 tests)
- Validate deployment artifacts structure
- Validate environment variable configuration
- Validate local chain metadata
- Validate RPC URL format
- Handle development workflow state
- Validate contract addresses are different
- Validate faucet configuration
- Validate API endpoint configuration
- Validate chain connection parameters
- Handle deployment artifact updates

**Requirements Tested:** 2.5 - Local development automation

### API Integration Tests (12 tests)

#### Faucet API (12 tests)
- Validate faucet request schema
- Reject invalid address formats
- Validate successful response structure
- Validate error response structure
- Handle rate limiting logic
- Validate faucet configuration
- Validate HTTP status codes
- Handle multiple addresses in rate limiter
- Validate transaction hash format
- Ensure faucet only works on local chain
- Handle concurrent requests
- Validate error messages

**Requirements Tested:**
- 5.3 - Faucet service accepts requests and transfers tokens
- 5.4 - Faucet service returns transaction hashes
- 5.5 - Faucet service rate limiting

### Contract Integration Tests (10 tests)

#### Local Deployment (10 tests)
- Deploy MockPYUSD contract
- Deploy MakeABetMarket contract
- Mint PYUSD to faucet address
- Transfer ETH to faucet address
- Verify PYUSD has 6 decimals
- Verify PYUSD token name and symbol
- Allow faucet to transfer PYUSD to users
- Allow faucet to transfer ETH to users
- Verify deployment artifacts structure
- Verify contracts deployed to different addresses

**Requirements Tested:** 2.5 - Local development automation

## Test Results

All 50 integration tests pass successfully:

```
✓ Web Tests: 28 passed
✓ API Tests: 12 passed
✓ Contract Tests: 10 passed
```

## Continuous Integration

Integration tests should be run:
- Before committing changes
- In CI/CD pipeline
- Before deploying to production
- After updating dependencies

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
pnpm install
```

### Tests fail with environment variable errors
Ensure `.env.local` files exist and contain required variables.

### Contract tests fail
```bash
pnpm --filter @makeabet/contracts compile
```

### Web tests fail with jsdom errors
```bash
pnpm --filter @makeabet/web install
```

## Writing New Tests

When adding new integration tests:

1. Place tests in appropriate `integration/` directory
2. Use descriptive test names
3. Test core functionality only
4. Keep tests minimal and focused
5. Reference requirements in comments
6. Update this document with new test coverage

## Test Philosophy

These integration tests follow the principle of testing core functionality without over-testing edge cases. They validate:

- **Data structures** and formats
- **Business logic** and workflows
- **Integration points** between components
- **Configuration** and environment setup

They do NOT test:
- UI rendering (use E2E tests for that)
- External API responses (use mocks)
- Every possible edge case (focus on happy path + critical errors)

## Related Documentation

- [Web Test README](apps/web/src/test/README.md)
- [API Test README](apps/api/src/test/README.md)
- [Contract Test README](apps/contracts/test/integration/README.md)
- [Workflow Verification](WORKFLOW_VERIFICATION.md)
