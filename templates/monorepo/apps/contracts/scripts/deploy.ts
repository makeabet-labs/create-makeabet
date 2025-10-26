import hre from 'hardhat';

const ethers = hre.ethers;

async function main() {
  const pythAddress = process.env.PYTH_CONTRACT_ADDRESS ?? '';
  if (!pythAddress) {
    throw new Error('Missing PYTH_CONTRACT_ADDRESS in environment');
  }

  const factory = await ethers.getContractFactory('MakeABetMarket');
  const contract = await factory.deploy(pythAddress);
  await contract.waitForDeployment();

  console.log('MakeABetMarket deployed to', await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
