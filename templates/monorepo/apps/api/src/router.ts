import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ethers } from 'ethers';

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
      const body = faucetSchema.safeParse(request.body ?? {});
      if (!body.success) {
        reply.code(400);
        const message = body.error.issues?.[0]?.message ?? 'Invalid request';
        return { ok: false, error: message };
      }

      const providerUrl = process.env.LOCAL_RPC_URL ?? 'http://127.0.0.1:8545';
      const provider = new ethers.JsonRpcProvider(providerUrl);

      const defaultHardhatKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const privateKey = process.env.LOCAL_FAUCET_PRIVATE_KEY ?? defaultHardhatKey;

      const wallet = new ethers.Wallet(privateKey, provider);
      const recipient = body.data.address;

      const responses: string[] = [];

      const ethAmount = ethers.parseEther(process.env.LOCAL_FAUCET_ETH_AMOUNT ?? '1');
      const ethTx = await wallet.sendTransaction({ to: recipient, value: ethAmount });
      responses.push(ethTx.hash);

      const pyusdAddress = process.env.LOCAL_PYUSD_ADDRESS ?? process.env.PYUSD_CONTRACT_ADDRESS;
      if (pyusdAddress) {
        const erc20 = new ethers.Contract(pyusdAddress, ['function transfer(address to,uint256 amount) returns (bool)'], wallet);
        const pyusdAmount = ethers.parseUnits(process.env.LOCAL_FAUCET_PYUSD_AMOUNT ?? '100', 6);
        const tokenTx = await erc20.transfer(recipient, pyusdAmount);
        responses.push(tokenTx.hash);
      }

      await Promise.all(responses.map(async (hash) => provider.waitForTransaction(hash)));

      return { ok: true, transactions: responses };
    });
  }
}
