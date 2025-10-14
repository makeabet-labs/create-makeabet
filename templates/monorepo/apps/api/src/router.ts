import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ethers } from 'ethers';

const faucetAbi = ['function transfer(address to,uint256 amount) returns (bool)'];

type ChainType = 'evm' | 'solana';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/config', async () => {
    const chainType = (process.env.CHAIN_TYPE ?? 'evm') as ChainType;
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
    };
  });

  if ((process.env.LOCAL_CHAIN_ENABLED ?? 'false') === 'true') {
    const faucetSchema = z.object({
      address: z
        .string()
        .trim()
        .refine((value) => ethers.isAddress(value), { message: 'Invalid address' }),
    });

    app.post('/faucet', async (request, reply) => {
      const parsed = faucetSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        reply.code(400);
        const message = parsed.error.issues?.[0]?.message ?? 'Invalid request';
        return { ok: false, error: message };
      }

      const providerUrl = process.env.LOCAL_RPC_URL ?? 'http://127.0.0.1:8545';
      const provider = new ethers.JsonRpcProvider(providerUrl);

      const defaultHardhatKey =
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const privateKey = process.env.LOCAL_FAUCET_PRIVATE_KEY ?? defaultHardhatKey;

      const wallet = new ethers.Wallet(privateKey, provider);
      const recipient = parsed.data.address;

      try {
        const receipts: string[] = [];

        const ethAmount = ethers.parseEther(process.env.LOCAL_FAUCET_ETH_AMOUNT ?? '1');
        const ethTx = await wallet.sendTransaction({ to: recipient, value: ethAmount });
        receipts.push(ethTx.hash);

        const pyusdAddress = process.env.LOCAL_PYUSD_ADDRESS ?? process.env.PYUSD_CONTRACT_ADDRESS;
        if (pyusdAddress) {
          const erc20 = new ethers.Contract(pyusdAddress, faucetAbi, wallet);
          const pyusdAmount = ethers.parseUnits(process.env.LOCAL_FAUCET_PYUSD_AMOUNT ?? '100', 6);
          const tokenTx = await erc20.transfer(recipient, pyusdAmount);
          receipts.push(tokenTx.hash);
        }

        await Promise.all(receipts.map((hash) => provider.waitForTransaction(hash)));

        return { ok: true, transactions: receipts };
      } catch (error) {
        app.log.error({ err: error }, 'local faucet failed');
        reply.code(500);
        const message =
          error instanceof Error && error.message.toLowerCase().includes('nonce')
            ? 'Local faucet busy, please retry in a few seconds.'
            : error instanceof Error
              ? error.message
              : 'Unexpected faucet error';
        return { ok: false, error: message };
      }
    });
  }
}
