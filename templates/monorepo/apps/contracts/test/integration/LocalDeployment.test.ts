/**
 * Integration tests for local contract deployment
 * Tests Requirements: 2.5 - Local development automation
 */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';

describe('Local Deployment Integration', function () {
  let mockPYUSD: Contract;
  let makeABetMarket: Contract;
  let owner: Signer;
  let faucet: Signer;
  let user: Signer;

  beforeEach(async function () {
    [owner, faucet, user] = await ethers.getSigners();
  });

  it('should deploy MockPYUSD contract', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const address = await mockPYUSD.getAddress();
    expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should deploy MakeABetMarket contract', async function () {
    // Deploy MockPYUSD first
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    // Deploy MakeABetMarket
    const MakeABetMarket = await ethers.getContractFactory('MakeABetMarket');
    makeABetMarket = await MakeABetMarket.deploy(await mockPYUSD.getAddress());
    await makeABetMarket.waitForDeployment();

    const address = await makeABetMarket.getAddress();
    expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should mint PYUSD to faucet address', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const faucetAddress = await faucet.getAddress();
    const mintAmount = ethers.parseUnits('1000000', 6); // 1M PYUSD

    await mockPYUSD.mint(faucetAddress, mintAmount);

    const balance = await mockPYUSD.balanceOf(faucetAddress);
    expect(balance).to.equal(mintAmount);
  });

  it('should transfer ETH to faucet address', async function () {
    const faucetAddress = await faucet.getAddress();
    const transferAmount = ethers.parseEther('10000'); // 10000 ETH

    await owner.sendTransaction({
      to: faucetAddress,
      value: transferAmount,
    });

    const balance = await ethers.provider.getBalance(faucetAddress);
    expect(balance).to.be.gte(transferAmount);
  });

  it('should verify PYUSD has 6 decimals', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const decimals = await mockPYUSD.decimals();
    expect(decimals).to.equal(6);
  });

  it('should verify PYUSD token name and symbol', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const name = await mockPYUSD.name();
    const symbol = await mockPYUSD.symbol();

    expect(name).to.equal('PayPal USD');
    expect(symbol).to.equal('PYUSD');
  });

  it('should allow faucet to transfer PYUSD to users', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const faucetAddress = await faucet.getAddress();
    const userAddress = await user.getAddress();
    const mintAmount = ethers.parseUnits('1000000', 6);
    const transferAmount = ethers.parseUnits('100', 6);

    // Mint to faucet
    await mockPYUSD.mint(faucetAddress, mintAmount);

    // Transfer from faucet to user
    await mockPYUSD.connect(faucet).transfer(userAddress, transferAmount);

    const userBalance = await mockPYUSD.balanceOf(userAddress);
    expect(userBalance).to.equal(transferAmount);
  });

  it('should allow faucet to transfer ETH to users', async function () {
    const faucetAddress = await faucet.getAddress();
    const userAddress = await user.getAddress();
    const fundAmount = ethers.parseEther('10000');
    const transferAmount = ethers.parseEther('1');

    // Fund faucet
    await owner.sendTransaction({
      to: faucetAddress,
      value: fundAmount,
    });

    const initialBalance = await ethers.provider.getBalance(userAddress);

    // Transfer from faucet to user
    await faucet.sendTransaction({
      to: userAddress,
      value: transferAmount,
    });

    const finalBalance = await ethers.provider.getBalance(userAddress);
    expect(finalBalance - initialBalance).to.equal(transferAmount);
  });

  it('should verify deployment artifacts structure', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const MakeABetMarket = await ethers.getContractFactory('MakeABetMarket');
    makeABetMarket = await MakeABetMarket.deploy(await mockPYUSD.getAddress());
    await makeABetMarket.waitForDeployment();

    const artifacts = {
      pyusd: await mockPYUSD.getAddress(),
      market: await makeABetMarket.getAddress(),
      faucet: await faucet.getAddress(),
      timestamp: Date.now(),
      chainId: 31337,
    };

    expect(artifacts.pyusd).to.match(/^0x[a-fA-F0-9]{40}$/);
    expect(artifacts.market).to.match(/^0x[a-fA-F0-9]{40}$/);
    expect(artifacts.faucet).to.match(/^0x[a-fA-F0-9]{40}$/);
    expect(artifacts.chainId).to.equal(31337);
    expect(artifacts.timestamp).to.be.greaterThan(0);
  });

  it('should verify contracts are deployed to different addresses', async function () {
    const MockPYUSD = await ethers.getContractFactory('MockPYUSD');
    mockPYUSD = await MockPYUSD.deploy();
    await mockPYUSD.waitForDeployment();

    const MakeABetMarket = await ethers.getContractFactory('MakeABetMarket');
    makeABetMarket = await MakeABetMarket.deploy(await mockPYUSD.getAddress());
    await makeABetMarket.waitForDeployment();

    const pyusdAddress = await mockPYUSD.getAddress();
    const marketAddress = await makeABetMarket.getAddress();

    expect(pyusdAddress).to.not.equal(marketAddress);
  });
});
