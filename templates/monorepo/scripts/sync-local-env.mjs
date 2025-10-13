import fs from 'node:fs';
import path from 'node:path';

const deploymentPath = path.resolve('apps/contracts/deployments/local.json');
if (!fs.existsSync(deploymentPath)) {
  console.warn('No local deployment found at', deploymentPath);
  process.exit(0);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
const { pyusd, market, faucet } = deployment;

const ROOT_ENV = [
  'LOCAL_CHAIN_ENABLED=true',
  'LOCAL_CHAIN_ID=31337',
  'LOCAL_RPC_URL=http://127.0.0.1:8545',
  `LOCAL_PYUSD_ADDRESS=${pyusd ?? ''}`,
  'LOCAL_PYUSD_MINT=',
  'LOCAL_FAUCET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  `PYUSD_CONTRACT_ADDRESS=${pyusd ?? ''}`,
  'PYUSD_MINT_ADDRESS=',
  `MARKET_CONTRACT_ADDRESS=${market ?? ''}`,
  `LOCAL_MARKET_ADDRESS=${market ?? ''}`,
  `LOCAL_FAUCET_ADDRESS=${faucet ?? ''}`,
  'CHAIN_TYPE=evm',
  'TARGET_CHAIN=local-hardhat'
];

const API_ENV = [
  'CHAIN_TYPE=evm',
  'TARGET_CHAIN=local-hardhat',
  `PYUSD_CONTRACT_ADDRESS=${pyusd ?? ''}`,
  'PYUSD_MINT_ADDRESS=',
  'EVM_CHAIN_ID=31337',
  'EVM_RPC_URL=http://127.0.0.1:8545',
  'SOLANA_RPC_URL=',
  `MARKET_CONTRACT_ADDRESS=${market ?? ''}`
];

const WEB_ENV = [
  'VITE_LOCAL_CHAIN_ENABLED=true',
  'VITE_CHAIN_DEFAULT=local-hardhat',
  'VITE_TARGET_CHAIN=local-hardhat',
  'VITE_CHAIN_TYPE=evm',
  'VITE_WALLETCONNECT_PROJECT_ID=',
  'VITE_EVM_CHAIN_ID=31337',
  'VITE_EVM_RPC_URL=http://127.0.0.1:8545',
  `VITE_PYUSD_ADDRESS=${pyusd ?? ''}`,
  'VITE_PYUSD_MINT=',
  'VITE_SOLANA_RPC_URL=',
  'VITE_LOCAL_CHAIN_ID=31337',
  'VITE_LOCAL_RPC_URL=http://127.0.0.1:8545',
  `VITE_LOCAL_PYUSD_ADDRESS=${pyusd ?? ''}`,
  'VITE_LOCAL_PYUSD_MINT=',
  `VITE_MARKET_ADDRESS=${market ?? ''}`
];

writeEnv('.env.local', ROOT_ENV);
writeEnv('apps/api/.env.local', API_ENV);
writeEnv('apps/worker/.env.local', API_ENV);
writeEnv('apps/web/.env.local', WEB_ENV);

console.log('Synchronized local env with deployment:', deployment);

function writeEnv(relativePath, lines) {
  const targetPath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, lines.join('\n') + '\n');
}
