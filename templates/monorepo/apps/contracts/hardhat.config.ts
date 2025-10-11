import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-verify';
import * as dotenv from 'dotenv';

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_KEY ?? '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL ?? '',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    'arbitrum-sepolia': {
      url: process.env.ALCHEMY_ARBITRUM_SEPOLIA_URL ?? '',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    'base-sepolia': {
      url: process.env.ALCHEMY_BASE_SEPOLIA_URL ?? '',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY ?? '',
      'arbitrum-sepolia': process.env.ARBISCAN_API_KEY ?? '',
      'base-sepolia': process.env.BASESCAN_API_KEY ?? ''
    }
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6'
  }
};

export default config;
