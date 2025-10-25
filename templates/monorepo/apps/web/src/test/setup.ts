/**
 * Vitest setup file for frontend integration tests
 */

import { beforeAll, afterEach, afterAll } from 'vitest';

// Setup before all tests
beforeAll(() => {
  // Mock environment variables
  process.env.VITE_LOCAL_CHAIN_ENABLED = 'true';
  process.env.VITE_LOCAL_RPC_URL = 'http://127.0.0.1:8545';
  process.env.VITE_LOCAL_CHAIN_ID = '31337';
  process.env.VITE_API_URL = 'http://localhost:4000';
});

// Cleanup after each test
afterEach(() => {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});

// Cleanup after all tests
afterAll(() => {
  // Any global cleanup
});
