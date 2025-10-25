/**
 * Vitest setup file for API integration tests
 */

import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables
beforeAll(() => {
  dotenv.config({ path: '.env.local' });
  
  // Set test environment variables
  process.env.LOCAL_CHAIN_ENABLED = 'true';
  process.env.LOCAL_RPC_URL = 'http://127.0.0.1:8545';
  process.env.LOCAL_FAUCET_ETH_AMOUNT = '1';
  process.env.LOCAL_FAUCET_PYUSD_AMOUNT = '100';
});

// Cleanup after all tests
afterAll(() => {
  // Any global cleanup
});
