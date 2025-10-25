import fs from 'node:fs';
import path from 'node:path';
import { ethers, network } from 'hardhat';

async function main() {
  const [deployer, faucetSigner] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const faucetAddress = faucetSigner ? await faucetSigner.getAddress() : deployerAddress;

  console.log('Deploying contracts with deployer:', deployerAddress);
  console.log('Faucet signer:', faucetAddress);

  // Deploy MockPYUSD with initial supply
  const initialSupply = ethers.parseUnits('1000000', 6);
  const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
  const pyusd = await MockPYUSD.deploy(deployerAddress, initialSupply);
  await pyusd.waitForDeployment();
  console.log('MockPYUSD deployed to:', await pyusd.getAddress());

  // Deploy MakeABetMarket
  const pythPlaceholder = '0x0000000000000000000000000000000000000001';
  const Market = await ethers.getContractFactory('MakeABetMarket');
  const market = await Market.deploy(pythPlaceholder);
  await market.waitForDeployment();
  console.log('MakeABetMarket deployed to:', await market.getAddress());

  // Seed faucet with 1000000 PYUSD (1M tokens with 6 decimals)
  if (faucetAddress !== deployerAddress) {
    const faucetPYUSDAmount = ethers.parseUnits('1000000', 6);
    console.log('Minting', ethers.formatUnits(faucetPYUSDAmount, 6), 'PYUSD to faucet...');
    const mintTx = await pyusd.mint(faucetAddress, faucetPYUSDAmount);
    await mintTx.wait();
    console.log('Faucet PYUSD balance:', ethers.formatUnits(faucetPYUSDAmount, 6));
  }

  // Seed faucet with 10000 ETH (send 9999 to account for gas costs)
  if (faucetAddress !== deployerAddress) {
    const faucetETHAmount = ethers.parseEther('9999');
    console.log('Sending', ethers.formatEther(faucetETHAmount), 'ETH to faucet...');
    const ethTx = await deployer.sendTransaction({
      to: faucetAddress,
      value: faucetETHAmount,
    });
    await ethTx.wait();
    const faucetBalance = await ethers.provider.getBalance(faucetAddress);
    console.log('Faucet ETH balance:', ethers.formatEther(faucetBalance));
  }

  // Get chain ID
  const chainId = network.config.chainId || 31337;

  // Create deployment artifacts with timestamp and chainId
  const output = {
    pyusd: await pyusd.getAddress(),
    market: await market.getAddress(),
    faucet: faucetAddress,
    timestamp: Date.now(),
    chainId: chainId,
  };

  // Write deployment artifacts to deployments/local.json
  const deploymentsDir = path.resolve(__dirname, '../deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const deploymentPath = path.join(deploymentsDir, 'local.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(output, null, 2));

  console.log('Local deployment complete:', output);
  console.log('Deployment artifacts written to:', deploymentPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
