import { expect } from 'chai';
import hre from 'hardhat';
import { MakeABetMarket, MockPYUSD } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

const ethers = hre.ethers;

describe('MakeABetMarket', function () {
  let market: MakeABetMarket;
  let pyusd: MockPYUSD;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const MOCK_PYTH = '0x0000000000000000000000000000000000000001';

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    // Deploy MakeABetMarket
    const MarketFactory = await ethers.getContractFactory('MakeABetMarket');
    market = await MarketFactory.deploy(MOCK_PYTH);
    await market.waitForDeployment();

    // Deploy MockPYUSD
    const initialSupply = ethers.parseUnits('1000000', 6);
    const PYUSDFactory = await ethers.getContractFactory('MockPYUSD');
    pyusd = await PYUSDFactory.deploy(admin.address, initialSupply);
    await pyusd.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the correct Pyth address', async function () {
      expect(await market.pyth()).to.equal(MOCK_PYTH);
    });

    it('Should set the correct admin', async function () {
      expect(await market.admin()).to.equal(admin.address);
    });

    it('Should initialize nextRoomId to 0', async function () {
      expect(await market.nextRoomId()).to.equal(0);
    });
  });

  describe('Room Creation', function () {
    it('Should create a room with correct parameters', async function () {
      const question = 'Will ETH reach $5000?';
      const feedId = ethers.encodeBytes32String('ETH/USD');
      const expiry = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      await expect(market.createRoom(question, feedId, expiry))
        .to.emit(market, 'RoomCreated')
        .withArgs(0, question, feedId, expiry);

      const room = await market.rooms(0);
      expect(room.question).to.equal(question);
      expect(room.priceFeedId).to.equal(feedId);
      expect(room.expiry).to.equal(expiry);
      expect(room.settled).to.be.false;
      expect(room.outcome).to.be.false;
    });

    it('Should increment room IDs', async function () {
      const feedId = ethers.encodeBytes32String('ETH/USD');
      const expiry = Math.floor(Date.now() / 1000) + 86400;

      await market.createRoom('Question 1', feedId, expiry);
      await market.createRoom('Question 2', feedId, expiry);
      await market.createRoom('Question 3', feedId, expiry);

      expect(await market.nextRoomId()).to.equal(3);
    });

    it('Should revert if expiry is in the past', async function () {
      const question = 'Past question';
      const feedId = ethers.encodeBytes32String('ETH/USD');
      const expiry = Math.floor(Date.now() / 1000) - 1;

      await expect(
        market.createRoom(question, feedId, expiry)
      ).to.be.revertedWith('expiry must be future');
    });
  });

  describe('MockPYUSD', function () {
    it('Should have correct token metadata', async function () {
      expect(await pyusd.name()).to.equal('Mock PYUSD');
      expect(await pyusd.symbol()).to.equal('PYUSD');
      expect(await pyusd.decimals()).to.equal(6);
    });

    it('Should mint initial supply to admin', async function () {
      const expectedSupply = ethers.parseUnits('1000000', 6);
      expect(await pyusd.totalSupply()).to.equal(expectedSupply);
      expect(await pyusd.balanceOf(admin.address)).to.equal(expectedSupply);
    });

    it('Should allow owner to mint tokens', async function () {
      const mintAmount = ethers.parseUnits('1000', 6);
      await pyusd.mint(user1.address, mintAmount);
      expect(await pyusd.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it('Should revert when non-owner tries to mint', async function () {
      const mintAmount = ethers.parseUnits('1000', 6);
      await expect(
        pyusd.connect(user1).mint(user2.address, mintAmount)
      ).to.be.reverted;
    });

    it('Should allow token transfers', async function () {
      const transferAmount = ethers.parseUnits('500', 6);
      await pyusd.transfer(user1.address, transferAmount);
      
      expect(await pyusd.balanceOf(user1.address)).to.equal(transferAmount);
      
      await pyusd.connect(user1).transfer(user2.address, transferAmount);
      expect(await pyusd.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });
});
