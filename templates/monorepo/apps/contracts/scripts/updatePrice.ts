import { ethers } from 'hardhat';
import { PythConnection } from '@pythnetwork/pyth-evm-js';

async function main() {
  const contractAddress = process.env.MARKET_CONTRACT_ADDRESS;
  const priceService = process.env.PYTH_PRICE_SERVICE_URL ?? 'https://hermes.pyth.network';
  const feedId = process.env.PYTH_FEED_ID;

  if (!contractAddress || !feedId) {
    throw new Error('MARKET_CONTRACT_ADDRESS and PYTH_FEED_ID are required');
  }

  const connection = new PythConnection(priceService, { logger: console });
  const priceFeeds = await connection.getLatestPriceFeeds([feedId]);
  const priceFeed = priceFeeds[0];

  if (!priceFeed) {
    throw new Error(`Price feed ${feedId} not found`);
  }

  const contract = await ethers.getContractAt('MakeABetMarket', contractAddress);
  const fee = await contract.provider.call({
    to: await contract.getAddress(),
    data: '0x' // placeholder - actual update fee retrieval is handled in settlement script
  });

  console.log('Fetched price feed update with conf', priceFeed.getPriceNoOlderThan(60)?.conf, 'fee', fee);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
