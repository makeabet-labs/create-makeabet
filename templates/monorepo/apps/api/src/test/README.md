# API Integration Tests

This directory contains integration tests for the MakeABet API server.

## Test Structure

```
test/
├── setup.ts                          # Vitest setup and configuration
├── integration/
│   └── faucet-api.test.ts            # Faucet API endpoint tests
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
pnpm test faucet-api
```

## Test Coverage

### Faucet API Tests (faucet-api.test.ts)
- ✓ Validate faucet request schema
- ✓ Reject invalid address formats
- ✓ Validate successful response structure
- ✓ Validate error response structure
- ✓ Handle rate limiting logic
- ✓ Validate faucet configuration
- ✓ Validate HTTP status codes
- ✓ Handle multiple addresses in rate limiter
- ✓ Validate transaction hash format
- ✓ Ensure faucet only works on local chain
- ✓ Handle concurrent requests
- ✓ Validate error messages

**Requirements Tested:** 
- 5.3 - Faucet service accepts requests and transfers tokens
- 5.4 - Faucet service returns transaction hashes
- 5.5 - Faucet service rate limiting

## Test Environment

Tests run in a Node.js environment with the following setup:
- Load environment variables from `.env.local`
- Set test-specific environment variables
- Mock external dependencies as needed

## Writing New Tests

When adding new API integration tests:

1. Create test file in `integration/` directory
2. Import necessary utilities from vitest
3. Use descriptive test names
4. Test API logic without making actual HTTP requests
5. Focus on validation, business logic, and error handling
6. Reference requirements in comments

Example:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('API Endpoint Integration', () => {
  beforeEach(() => {
    // Setup
  });

  it('should validate request data', () => {
    const request = { /* ... */ };
    expect(request).toMatchSchema(schema);
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
Check that `.env.local` exists and `setup.ts` is loading it correctly.

### Tests fail with database errors
These are unit/integration tests that don't require a running database. If you see database errors, the test may be trying to connect to a real database instead of using mocks.
