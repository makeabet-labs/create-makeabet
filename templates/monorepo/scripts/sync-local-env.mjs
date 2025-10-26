import fs from 'node:fs';
import path from 'node:path';

/**
 * Synchronize local environment files with deployed contract addresses
 * Reads deployment artifacts from apps/contracts/deployments/local.json
 * and updates .env.local files across the monorepo
 */

const deploymentPath = path.resolve('apps/contracts/deployments/local.json');

// Check if deployment file exists
if (!fs.existsSync(deploymentPath)) {
  console.error('❌ Error: No local deployment found at', deploymentPath);
  console.error('Please run "pnpm deploy:local" first to deploy contracts.');
  process.exit(1);
}

// Read and parse deployment artifacts
let deployment;
try {
  const deploymentContent = fs.readFileSync(deploymentPath, 'utf8');
  deployment = JSON.parse(deploymentContent);
  console.log('📦 Reading deployment artifacts from:', deploymentPath);
} catch (error) {
  console.error('❌ Error: Failed to read or parse deployment file:', error.message);
  process.exit(1);
}

// Validate deployment structure
const { pyusd, market, faucet, timestamp, chainId } = deployment;
if (!pyusd || !market || !faucet) {
  console.error('❌ Error: Invalid deployment file. Missing required fields (pyusd, market, faucet)');
  console.error('Deployment content:', deployment);
  process.exit(1);
}

console.log('✅ Deployment artifacts loaded:');
console.log('   - PYUSD:', pyusd);
console.log('   - Market:', market);
console.log('   - Faucet:', faucet);
console.log('   - Chain ID:', chainId || 31337);
console.log('   - Timestamp:', timestamp ? new Date(timestamp).toISOString() : 'N/A');

// Root .env.local configuration
const ROOT_ENV = [
  '# Local Chain Configuration',
  'LOCAL_CHAIN_ENABLED=true',
  `LOCAL_CHAIN_ID=${chainId || 31337}`,
  'LOCAL_RPC_URL=http://127.0.0.1:8545',
  `LOCAL_PYUSD_ADDRESS=${pyusd}`,
  'LOCAL_PYUSD_MINT=',
  'LOCAL_FAUCET_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  `LOCAL_MARKET_ADDRESS=${market}`,
  `LOCAL_FAUCET_ADDRESS=${faucet}`,
  '',
  '# Active Chain Configuration',
  'CHAIN_TYPE=evm',
  'TARGET_CHAIN=local-hardhat',
  `PYUSD_CONTRACT_ADDRESS=${pyusd}`,
  'PYUSD_MINT_ADDRESS=',
  `MARKET_CONTRACT_ADDRESS=${market}`,
  '',
  '# Faucet Configuration',
  'LOCAL_FAUCET_ETH_AMOUNT=1',
  'LOCAL_FAUCET_PYUSD_AMOUNT=100',
];

// API and Worker .env.local configuration
const API_ENV = [
  '# Chain Configuration',
  'CHAIN_TYPE=evm',
  'TARGET_CHAIN=local-hardhat',
  `EVM_CHAIN_ID=${chainId || 31337}`,
  'EVM_RPC_URL=http://127.0.0.1:8545',
  'SOLANA_RPC_URL=',
  '',
  '# Contract Addresses',
  `PYUSD_CONTRACT_ADDRESS=${pyusd}`,
  'PYUSD_MINT_ADDRESS=',
  `MARKET_CONTRACT_ADDRESS=${market}`,
  '',
  '# Local Chain Configuration',
  'LOCAL_CHAIN_ENABLED=true',
  `LOCAL_CHAIN_ID=${chainId || 31337}`,
  'LOCAL_RPC_URL=http://127.0.0.1:8545',
  `LOCAL_PYUSD_ADDRESS=${pyusd}`,
  `LOCAL_MARKET_ADDRESS=${market}`,
  `LOCAL_FAUCET_ADDRESS=${faucet}`,
  'LOCAL_FAUCET_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
];

// Web .env.local configuration (frontend-specific with VITE_ prefix)
const WEB_ENV = [
  '# Local Chain Configuration',
  'VITE_LOCAL_CHAIN_ENABLED=true',
  `VITE_LOCAL_CHAIN_ID=${chainId || 31337}`,
  'VITE_LOCAL_RPC_URL=http://127.0.0.1:8545',
  `VITE_LOCAL_PYUSD_ADDRESS=${pyusd}`,
  'VITE_LOCAL_PYUSD_MINT=',
  '',
  '# Active Chain Configuration',
  'VITE_CHAIN_DEFAULT=local-hardhat',
  'VITE_TARGET_CHAIN=local-hardhat',
  'VITE_CHAIN_TYPE=evm',
  '',
  '# EVM Configuration',
  `VITE_EVM_CHAIN_ID=${chainId || 31337}`,
  'VITE_EVM_RPC_URL=http://127.0.0.1:8545',
  `VITE_PYUSD_ADDRESS=${pyusd}`,
  'VITE_PYUSD_MINT=',
  '',
  '# Solana Configuration',
  'VITE_SOLANA_RPC_URL=',
  '',
  '# Contract Addresses',
  `VITE_MARKET_ADDRESS=${market}`,
  '',
  '# WalletConnect',
  'VITE_WALLETCONNECT_PROJECT_ID=',
  '',
  '# API',
  'VITE_API_URL=http://localhost:4000',
];

// Write environment files
try {
  writeEnv('.env.local', ROOT_ENV);
  console.log('✅ Updated .env.local');
  
  writeEnv('apps/api/.env.local', API_ENV);
  console.log('✅ Updated apps/api/.env.local');
  
  writeEnv('apps/worker/.env.local', API_ENV);
  console.log('✅ Updated apps/worker/.env.local');
  
  writeEnv('apps/web/.env.local', WEB_ENV);
  console.log('✅ Updated apps/web/.env.local');
  
  console.log('\n🎉 Successfully synchronized local environment files with deployment!');
} catch (error) {
  console.error('❌ Error: Failed to write environment files:', error.message);
  process.exit(1);
}

/**
 * Write environment variables to a file
 * @param {string} relativePath - Path relative to project root
 * @param {string[]} lines - Array of environment variable lines
 */
function writeEnv(relativePath, lines) {
  const targetPath = path.resolve(relativePath);
  const dirPath = path.dirname(targetPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Write file with newline at end
  fs.writeFileSync(targetPath, lines.join('\n') + '\n', 'utf8');
}
