import { HardhatUserConfig } from 'hardhat/config';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const PRIVATE_KEY = process.env.DEPLOYER_KEY ?? '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337
    },
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    },
    sepolia: {
      type: 'http',
      url: process.env.ALCHEMY_SEPOLIA_URL || 'https://ethereum-sepolia.publicnode.com',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111
    },
    'arbitrum-sepolia': {
      type: 'http',
      url: process.env.ALCHEMY_ARBITRUM_SEPOLIA_URL || 'https://arbitrum-sepolia.publicnode.com',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614
    },
    'base-sepolia': {
      type: 'http',
      url: process.env.ALCHEMY_BASE_SEPOLIA_URL || 'https://base-sepolia.publicnode.com',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY ?? '',
      arbitrumSepolia: process.env.ARBISCAN_API_KEY ?? '',
      baseSepolia: process.env.BASESCAN_API_KEY ?? ''
    },
    customChains: [
      {
        network: 'arbitrum-sepolia',
        chainId: 421614,
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io'
        }
      },
      {
        network: 'base-sepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org'
        }
      }
    ]
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6'
  }
};

export default config;
