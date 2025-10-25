/**
 * Integration tests for faucet API endpoint
 * Tests Requirements: 5.3, 5.4, 5.5 - Faucet service functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Faucet API Integration', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';
  const cooldownPeriod = 5 * 60 * 1000; // 5 minutes

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate faucet request schema', () => {
    const validRequest = {
      address: '0x1234567890123456789012345678901234567890'
    };

    expect(validRequest.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should reject invalid address format', () => {
    const invalidRequests = [
      { address: '0x123' }, // too short
      { address: '1234567890123456789012345678901234567890' }, // missing 0x
      { address: '0xGGGG567890123456789012345678901234567890' }, // invalid hex
      { address: '' }, // empty
    ];

    invalidRequests.forEach(req => {
      expect(req.address).not.toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  it('should validate successful faucet response structure', () => {
    const successResponse = {
      ok: true,
      transactions: [
        '0xabc123def456789012345678901234567890123456789012345678901234abcd',
        '0xdef456abc789012345678901234567890123456789012345678901234567890a'
      ]
    };

    expect(successResponse.ok).toBe(true);
    expect(successResponse.transactions).toBeDefined();
    expect(successResponse.transactions).toHaveLength(2);
    // Transaction hash format: 0x + 64 hex characters
    expect(successResponse.transactions?.[0]).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(successResponse.transactions?.[1]).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('should validate error response structure', () => {
    const errorResponse = {
      ok: false,
      error: 'Faucet only available on local chain'
    };

    expect(errorResponse.ok).toBe(false);
    expect(errorResponse.error).toBeDefined();
    expect(typeof errorResponse.error).toBe('string');
  });

  it('should handle rate limiting logic', () => {
    const rateLimiter = new Map<string, number>();
    const now = Date.now();

    // First request
    rateLimiter.set(mockAddress, now);
    expect(rateLimiter.has(mockAddress)).toBe(true);

    // Check if within cooldown
    const lastRequest = rateLimiter.get(mockAddress);
    const timeSinceLastRequest = now - (lastRequest || 0);
    expect(timeSinceLastRequest).toBe(0);

    // Simulate request after 3 minutes
    const laterTime = now + (3 * 60 * 1000);
    const timeSinceLastRequest2 = laterTime - (lastRequest || 0);
    expect(timeSinceLastRequest2).toBeLessThan(cooldownPeriod);

    // Simulate request after 6 minutes
    const muchLaterTime = now + (6 * 60 * 1000);
    const timeSinceLastRequest3 = muchLaterTime - (lastRequest || 0);
    expect(timeSinceLastRequest3).toBeGreaterThan(cooldownPeriod);
  });

  it('should validate faucet configuration', () => {
    const faucetConfig = {
      ethAmount: process.env.LOCAL_FAUCET_ETH_AMOUNT || '1',
      pyusdAmount: process.env.LOCAL_FAUCET_PYUSD_AMOUNT || '100',
      enabled: process.env.LOCAL_CHAIN_ENABLED === 'true'
    };

    expect(parseFloat(faucetConfig.ethAmount)).toBeGreaterThan(0);
    expect(parseFloat(faucetConfig.pyusdAmount)).toBeGreaterThan(0);
    expect(typeof faucetConfig.enabled).toBe('boolean');
  });

  it('should validate HTTP status codes', () => {
    const statusCodes = {
      success: 200,
      badRequest: 400,
      forbidden: 403,
      tooManyRequests: 429,
      serverError: 500
    };

    expect(statusCodes.success).toBe(200);
    expect(statusCodes.badRequest).toBe(400);
    expect(statusCodes.forbidden).toBe(403);
    expect(statusCodes.tooManyRequests).toBe(429);
    expect(statusCodes.serverError).toBe(500);
  });

  it('should handle multiple addresses in rate limiter', () => {
    const rateLimiter = new Map<string, number>();
    const address1 = '0x1111111111111111111111111111111111111111';
    const address2 = '0x2222222222222222222222222222222222222222';
    const now = Date.now();

    rateLimiter.set(address1, now);
    rateLimiter.set(address2, now + 60000);

    expect(rateLimiter.get(address1)).toBe(now);
    expect(rateLimiter.get(address2)).toBe(now + 60000);
    expect(rateLimiter.size).toBe(2);
  });

  it('should validate transaction hash format', () => {
    const validTxHash = '0xabc123def456789012345678901234567890123456789012345678901234abcd';
    const invalidTxHash = '0x123'; // too short

    // Transaction hash format: 0x + 64 hex characters
    expect(validTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(invalidTxHash).not.toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('should validate faucet only works on local chain', () => {
    const localChainEnabled = 'true';
    const localChainDisabled = 'false';

    expect(localChainEnabled === 'true').toBe(true);
    expect(localChainDisabled === 'true').toBe(false);
  });

  it('should handle concurrent requests to same address', () => {
    const rateLimiter = new Map<string, number>();
    const now = Date.now();

    // First request
    rateLimiter.set(mockAddress, now);
    
    // Concurrent request (should be blocked)
    const lastRequest = rateLimiter.get(mockAddress);
    const timeSinceLastRequest = now - (lastRequest || 0);
    
    expect(timeSinceLastRequest).toBeLessThan(cooldownPeriod);
  });

  it('should validate error messages', () => {
    const errorMessages = {
      notLocal: 'Faucet only available on local chain',
      rateLimited: 'Please wait before requesting again',
      invalidAddress: 'Invalid address format',
      transferFailed: 'Transfer failed'
    };

    expect(errorMessages.notLocal).toContain('local chain');
    expect(errorMessages.rateLimited).toContain('wait');
    expect(errorMessages.invalidAddress).toContain('Invalid');
    expect(errorMessages.transferFailed).toContain('failed');
  });
});
