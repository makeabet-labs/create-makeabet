import { ethers } from 'hardhat';

async function main() {
  const contractAddress = process.env.MARKET_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('MARKET_CONTRACT_ADDRESS is required');
  }

  const question = process.env.ROOM_QUESTION ?? 'SOL price >= $200?';
  const feedId = process.env.PYTH_FEED_ID ?? '';
  const expiry = Number(process.env.ROOM_EXPIRY ?? Math.floor(Date.now() / 1000) + 3600);

  if (!feedId) {
    throw new Error('PYTH_FEED_ID is required');
  }

  const contract = await ethers.getContractAt('MakeABetMarket', contractAddress);
  const tx = await contract.createRoom(question, feedId, expiry);
  const receipt = await tx.wait();

  console.log('Room created in tx', receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
