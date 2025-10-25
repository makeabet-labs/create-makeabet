# Contract Integration Tests

This directory contains integration tests for smart contract deployment and local development workflow.

## Test Structure

```
integration/
├── LocalDeployment.test.ts           # Local deployment workflow tests
└── README.md                         # This file
```

## Running Tests

### Run all tests (including integration tests)
```bash
pnpm test
```

### Run only integration tests
```bash
pnpm test test/integration
```

### Run with coverage
```bash
pnpm coverage
```

## Test Coverage

### Local Deployment Tests (LocalDeployment.test.ts)
- ✓ Deploy MockPYUSD contract
- ✓ Deploy MakeABetMarket contract
- ✓ Mint PYUSD to faucet address
- ✓ Transfer ETH to faucet address
- ✓ Verify PYUSD has 6 decimals
- ✓ Verify PYUSD token name and symbol
- ✓ Allow faucet to transfer PYUSD to users
- ✓ Allow faucet to transfer ETH to users
- ✓ Verify deployment artifacts structure
- ✓ Verify contracts deployed to different addresses

**Requirements Tested:** 2.5 - Local development automation

## Test Environment

Tests run against a local Hardhat network with:
- Hardhat 3.0.0+
- Ethers v6
- Chai matchers for assertions
- Multiple test signers (owner, faucet, user)

## Writing New Tests

When adding new contract integration tests:

1. Create test file in `integration/` directory
2. Import necessary utilities from Hardhat and Chai
3. Use descriptive test names
4. Deploy contracts in `beforeEach` hooks
5. Test actual contract interactions
6. Verify on-chain state changes
7. Reference requirements in comments

Example:
```typescript
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Contract Feature Integration', function () {
  let contract: Contract;
  let owner: Signer;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('MyContract');
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it('should perform action', async function () {
    await contract.doSomething();
    const result = await contract.getSomething();
    expect(result).to.equal(expectedValue);
  });
});
```

## Troubleshooting

### Tests fail with "Cannot find module"
Make sure dependencies are installed:
```bash
pnpm install
```

### Tests fail with compilation errors
Compile contracts first:
```bash
pnpm compile
```

### Tests timeout
Increase timeout in test or hardhat config:
```typescript
it('should complete', async function () {
  this.timeout(10000); // 10 seconds
  // test
});
```

### Network errors
Make sure you're not trying to connect to a real network. Integration tests should use Hardhat's built-in network.
