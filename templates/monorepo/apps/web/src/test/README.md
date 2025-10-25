# Integration Tests

This directory contains integration tests for the MakeABet web application.

## Test Structure

```
test/
├── setup.ts                          # Vitest setup and configuration
├── integration/
│   ├── chain-switching.test.ts       # Chain switching functionality tests
│   ├── faucet.test.ts                # Faucet request and rate limiting tests
│   └── local-dev-flow.test.ts        # Local development workflow tests
└── README.md                         # This file
```

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test --watch
```

### Run tests with coverage
```bash
pnpm test --coverage
```

### Run specific test file
```bash
pnpm test chain-switching
```

## Test Coverage

### Chain Switching Tests (chain-switching.test.ts)
- ✓ Store and retrieve selected chain from localStorage
- ✓ Handle chain switches between different networks
- ✓ Clear chain-specific data when switching
- ✓ Validate chain metadata structure
- ✓ Support both EVM and Solana chains

**Requirements Tested:** 3.4 - Balance refresh on chain change

### Faucet Tests (faucet.test.ts)
- ✓ Allow faucet requests when no previous request exists
- ✓ Block requests within cooldown period (5 minutes)
- ✓ Allow requests after cooldown period
- ✓ Calculate remaining cooldown time correctly
- ✓ Handle multiple addresses independently
- ✓ Validate request/response structures
- ✓ Handle error responses (rate limit, network errors)

**Requirements Tested:** 5.7 - Faucet request flow and notifications

### Local Development Flow Tests (local-dev-flow.test.ts)
- ✓ Validate deployment artifacts structure
- ✓ Validate environment variable configuration
- ✓ Validate local chain metadata
- ✓ Validate RPC URL format
- ✓ Handle development workflow state
- ✓ Validate contract addresses
- ✓ Validate faucet configuration
- ✓ Validate API endpoint configuration

**Requirements Tested:** 2.5 - Local development automation

## Test Environment

Tests run in a jsdom environment with the following setup:
- Mock environment variables for local chain
- Clean localStorage before each test
- Isolated test execution

## Writing New Tests

When adding new integration tests:

1. Create test file in `integration/` directory
2. Import necessary utilities from vitest
3. Use descriptive test names
4. Test core functionality only (avoid edge cases)
5. Keep tests minimal and focused
6. Reference requirements in comments

Example:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Integration', () => {
  beforeEach(() => {
    // Setup
  });

  it('should test core functionality', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Troubleshooting

### Tests fail with "Cannot find module"
Make sure dependencies are installed:
```bash
pnpm install
```

### Tests fail with environment variable errors
Check that `setup.ts` is properly configuring test environment variables.

### Tests timeout
Increase timeout in vitest config or specific test:
```typescript
it('should complete', { timeout: 10000 }, async () => {
  // test
});
```
