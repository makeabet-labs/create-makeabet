import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ethers } from 'ethers';
import { ConfigResponse } from '@makeabet/shared-core';

const faucetAbi = ['function transfer(address to,uint256 amount) returns (bool)'];

type ChainType = 'evm' | 'solana';

// Mutex lock to prevent concurrent faucet requests
let faucetProcessing = false;

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/config', async (): Promise<ConfigResponse> => {
    const chainType = (process.env.CHAIN_TYPE ?? 'evm') as ChainType;
    const localChainEnabled = (process.env.LOCAL_CHAIN_ENABLED ?? 'false') === 'true';
    
    return {
      paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
      pythEndpoint: process.env.PYTH_PRICE_SERVICE_URL ?? '',
      targetChain: process.env.TARGET_CHAIN ?? 'sepolia',
      chainType,
      pyusdAddress: chainType === 'evm' ? process.env.PYUSD_CONTRACT_ADDRESS ?? '' : undefined,
      pyusdMint: chainType === 'solana' ? process.env.PYUSD_MINT_ADDRESS ?? '' : undefined,
      rpcUrl:
        chainType === 'evm'
          ? process.env.EVM_RPC_URL ?? ''
          : process.env.SOLANA_RPC_URL ?? '',
      localChainEnabled,
      faucetAvailable: localChainEnabled,
      explorerUrl: process.env.BLOCK_EXPLORER_URL,
      marketAddress: process.env.MARKET_CONTRACT_ADDRESS,
    };
  });

  if ((process.env.LOCAL_CHAIN_ENABLED ?? 'false') === 'true') {
    const faucetSchema = z.object({
      address: z
        .string()
        .trim()
        .refine((value) => ethers.isAddress(value), { message: 'Invalid address' }),
    });

    // Rate limiter disabled for local development
    // const faucetRateLimiter = new Map<string, number>();
    // const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

    app.post('/faucet', async (request, reply) => {
      const parsed = faucetSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        reply.code(400);
        const message = parsed.error.issues?.[0]?.message ?? 'Invalid request';
        return { ok: false, error: message };
      }

      const { address } = parsed.data;

      // Check if faucet is already processing a request
      if (faucetProcessing) {
        reply.code(429);
        return {
          ok: false,
          error: 'Faucet is currently processing another request. Please wait a moment and try again.'
        };
      }

      // Rate limiting disabled for local development
      // const lastRequest = faucetRateLimiter.get(address);
      // if (lastRequest) {
      //   const elapsed = Date.now() - lastRequest;
      //   if (elapsed < COOLDOWN_MS) {
      //     const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      //     reply.code(429);
      //     return { 
      //       ok: false, 
      //       error: `Please wait ${remainingSeconds} seconds before requesting again` 
      //     };
      //   }
      // }

      // Set processing flag
      faucetProcessing = true;

      const providerUrl = process.env.LOCAL_RPC_URL ?? 'http://127.0.0.1:8545';
      const provider = new ethers.JsonRpcProvider(providerUrl);

      const defaultHardhatKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const privateKey = process.env.LOCAL_FAUCET_PRIVATE_KEY ?? defaultHardhatKey;

      const wallet = new ethers.Wallet(privateKey, provider);
      const recipient = address;

      try {
        const receipts: string[] = [];
        const ethAmount = ethers.parseEther(process.env.LOCAL_FAUCET_ETH_AMOUNT ?? '1');
        const pyusdAddress = process.env.LOCAL_PYUSD_ADDRESS ?? process.env.PYUSD_CONTRACT_ADDRESS;

        // Get current nonce explicitly to avoid conflicts
        let currentNonce = await provider.getTransactionCount(wallet.address, 'latest');
        app.log.info({ 
          address, 
          ethAmount: ethAmount.toString(), 
          faucetAddress: wallet.address,
          startingNonce: currentNonce 
        }, 'Processing faucet request');

        // Send ETH with explicit nonce
        try {
          const ethTx = await wallet.sendTransaction({ 
            to: recipient, 
            value: ethAmount,
            nonce: currentNonce
          });
          receipts.push(ethTx.hash);
          app.log.info({ hash: ethTx.hash, amount: ethAmount.toString(), nonce: currentNonce }, 'ETH transfer sent');
          // Wait for ETH transaction to be mined before sending PYUSD
          await ethTx.wait();
          app.log.info({ hash: ethTx.hash }, 'ETH transfer confirmed');
          currentNonce++; // Increment for next transaction
        } catch (error) {
          app.log.error({ err: error, address, nonce: currentNonce }, 'ETH transfer failed');
          throw error;
        }

        // Send PYUSD if configured with explicit nonce
        if (pyusdAddress) {
          try {
            const erc20 = new ethers.Contract(pyusdAddress, faucetAbi, wallet);
            const pyusdAmount = ethers.parseUnits(process.env.LOCAL_FAUCET_PYUSD_AMOUNT ?? '100', 6);
            const tokenTx = await erc20.transfer(recipient, pyusdAmount, { nonce: currentNonce });
            receipts.push(tokenTx.hash);
            app.log.info({ hash: tokenTx.hash, amount: pyusdAmount.toString(), nonce: currentNonce }, 'PYUSD transfer sent');
            // Wait for PYUSD transaction to be mined
            await tokenTx.wait();
            app.log.info({ hash: tokenTx.hash }, 'PYUSD transfer confirmed');
          } catch (error) {
            app.log.error({ err: error, address, pyusdAddress, nonce: currentNonce }, 'PYUSD transfer failed');
            throw error;
          }
        }

        app.log.info({ address, transactions: receipts }, 'Faucet request completed successfully');

        // Rate limiter disabled for local development
        // faucetRateLimiter.set(address, Date.now());

        return { ok: true, transactions: receipts };
      } catch (error) {
        app.log.error({ err: error, address, errorDetails: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error }, 'Faucet request failed');
        reply.code(500);

        // Provide specific error messages for common failures
        let message = 'Unexpected faucet error';
        
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase();
          
          // Log the full error message for debugging
          app.log.error({ fullErrorMessage: error.message }, 'Full error details');
          
          if (errorMsg.includes('nonce')) {
            message = 'Faucet is busy processing another request. Please retry in a few seconds.';
          } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('insufficient balance')) {
            message = 'Faucet has insufficient funds. Please contact the administrator.';
            app.log.error({ address }, 'CRITICAL: Faucet wallet has insufficient funds');
          } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
            message = 'Network connection error. Please check if the local chain is running.';
          } else if (errorMsg.includes('gas')) {
            message = 'Gas estimation failed. Please ensure the local chain is running correctly.';
          } else {
            message = error.message;
          }
        }

        return { ok: false, error: message };
      } finally {
        // Always release the lock
        faucetProcessing = false;
      }
    });
  }
}
