import fs from 'node:fs';
import path from 'node:path';
import hre from 'hardhat';
import { ethers } from 'ethers';

async function main() {
  // Get signers from hardhat network
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const deployer = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  const faucetSigner = new ethers.Wallet(
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    provider
  );

  const deployerAddress = await deployer.getAddress();
  const faucetAddress = await faucetSigner.getAddress();

  console.log('Deploying contracts with deployer:', deployerAddress);
  console.log('Faucet signer:', faucetAddress);

  // Get contract artifacts
  const MockPYUSDArtifact = await hre.artifacts.readArtifact('MockPYUSD');
  const MarketArtifact = await hre.artifacts.readArtifact('MakeABetMarket');

  // Deploy MockPYUSD with initial supply
  const initialSupply = ethers.parseUnits('1000000', 6);
  const MockPYUSDFactory = new ethers.ContractFactory(
    MockPYUSDArtifact.abi,
    MockPYUSDArtifact.bytecode,
    deployer
  );

  let nonce = await provider.getTransactionCount(deployerAddress);
  const pyusdDeployment = await MockPYUSDFactory.deploy(deployerAddress, initialSupply, { nonce: nonce++ });
  await pyusdDeployment.waitForDeployment();
  const pyusdAddress = await pyusdDeployment.getAddress();
  console.log('MockPYUSD deployed to:', pyusdAddress);

  // Get typed contract instance
  const pyusd = new ethers.Contract(pyusdAddress, MockPYUSDArtifact.abi, deployer);

  // Deploy MakeABetMarket
  const pythPlaceholder = '0x0000000000000000000000000000000000000001';
  const MarketFactory = new ethers.ContractFactory(
    MarketArtifact.abi,
    MarketArtifact.bytecode,
    deployer
  );
  const market = await MarketFactory.deploy(pythPlaceholder, { nonce: nonce++ });
  await market.waitForDeployment();
  console.log('MakeABetMarket deployed to:', await market.getAddress());

  // Seed faucet with 1000000 PYUSD (1M tokens with 6 decimals)
  const faucetPYUSDAmount = ethers.parseUnits('1000000', 6);
  console.log('Minting', ethers.formatUnits(faucetPYUSDAmount, 6), 'PYUSD to faucet...');
  const mintTx = await pyusd.mint(faucetAddress, faucetPYUSDAmount, { nonce: nonce++ });
  await mintTx.wait();
  console.log('Faucet PYUSD balance:', ethers.formatUnits(faucetPYUSDAmount, 6));

  // Seed faucet with 10000 ETH (send 9999 to account for gas costs)
  const faucetETHAmount = ethers.parseEther('9999');
  console.log('Sending', ethers.formatEther(faucetETHAmount), 'ETH to faucet...');
  const ethTx = await deployer.sendTransaction({
    to: faucetAddress,
    value: faucetETHAmount,
    nonce: nonce++,
  });
  await ethTx.wait();
  const faucetBalance = await provider.getBalance(faucetAddress);
  console.log('Faucet ETH balance:', ethers.formatEther(faucetBalance));

  // Get chain ID
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  // Create deployment artifacts with timestamp and chainId
  const output = {
    pyusd: pyusdAddress,
    market: await market.getAddress(),
    faucet: faucetAddress,
    timestamp: Date.now(),
    chainId: chainId,
  };

  // Write deployment artifacts to deployments/local.json
  const deploymentsDir = path.resolve(import.meta.dirname, '../deployments');
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
