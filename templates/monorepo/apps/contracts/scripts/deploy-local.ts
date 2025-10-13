import fs from 'node:fs';
import path from 'node:path';
import { ethers } from 'hardhat';

async function main() {
  const [deployer, faucetSigner] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const faucetAddress = faucetSigner ? await faucetSigner.getAddress() : deployerAddress;

  const initialSupply = ethers.parseUnits('1000000', 6);

  const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
  const pyusd = await MockPYUSD.deploy(deployerAddress, initialSupply);
  await pyusd.waitForDeployment();

  const pythPlaceholder = '0x0000000000000000000000000000000000000001';
  const Market = await ethers.getContractFactory('MakeABetMarket');
  const market = await Market.deploy(pythPlaceholder);
  await market.waitForDeployment();

  if (faucetAddress !== deployerAddress) {
    const additional = ethers.parseUnits('500000', 6);
    const tx = await pyusd.mint(faucetAddress, additional);
    await tx.wait();
  }

  const output = {
    pyusd: await pyusd.getAddress(),
    market: await market.getAddress(),
    faucet: faucetAddress,
  };

  const deploymentsDir = path.resolve(__dirname, '../deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(path.join(deploymentsDir, 'local.json'), JSON.stringify(output, null, 2));

  console.log('Local deployment complete:', output);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
