import { ethers } from 'hardhat';
import { PythConnection } from '@pythnetwork/pyth-evm-js';

async function main() {
  const contractAddress = process.env.MARKET_CONTRACT_ADDRESS;
  const feedId = process.env.PYTH_FEED_ID;
  const priceService = process.env.PYTH_PRICE_SERVICE_URL ?? 'https://hermes.pyth.network';
  const targetPrice = Number(process.env.TARGET_PRICE ?? 0);
  const roomId = Number(process.env.ROOM_ID ?? 0);
  const updateFeeWei = BigInt(process.env.UPDATE_FEE_WEI ?? '0');

  if (!contractAddress || !feedId) {
    throw new Error('Missing MARKET_CONTRACT_ADDRESS or PYTH_FEED_ID');
  }

  const connection = new PythConnection(priceService, { logger: console });
  const priceUpdateData = await connection.getPriceFeedsUpdateData([feedId]);

  const contract = await ethers.getContractAt('MakeABetMarket', contractAddress);
  const tx = await contract.settleRoom(roomId, priceUpdateData, targetPrice, { value: updateFeeWei });
  const receipt = await tx.wait();

  console.log('Room settled in tx', receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
