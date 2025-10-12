#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import prompts from 'prompts';
import chalk from 'chalk';

type TargetChain = 'sepolia' | 'arbitrum-sepolia' | 'solana-devnet';
type ChainType = 'evm' | 'solana';

interface ScaffoldOptions {
  projectName: string;
  includeMerchantModule: boolean;
  targetChain: TargetChain;
  packageManager: 'pnpm' | 'npm' | 'yarn';
}

interface ChainConfig {
  id: TargetChain;
  label: string;
  chainType: ChainType;
  pyusdAddress?: string;
  pyusdMint?: string;
  chainId?: string;
  defaultRpc: string;
}

const CHAIN_CONFIG: Record<TargetChain, ChainConfig> = {
  sepolia: {
    id: 'sepolia',
    label: 'Ethereum Sepolia',
    chainType: 'evm',
    pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
    chainId: '11155111',
    defaultRpc: 'https://ethereum-sepolia.publicnode.com',
  },
  'arbitrum-sepolia': {
    id: 'arbitrum-sepolia',
    label: 'Arbitrum Sepolia',
    chainType: 'evm',
    pyusdAddress: '0xc6006A919685EA081697613373C50B6b46cd6F11',
    chainId: '421614',
    defaultRpc: 'https://arbitrum-sepolia.publicnode.com',
  },
  'solana-devnet': {
    id: 'solana-devnet',
    label: 'Solana Devnet',
    chainType: 'solana',
    pyusdMint: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    defaultRpc: 'https://api.devnet.solana.com',
  },
};

const TEMPLATE_ROOT = fileURLToPath(new URL('../../../templates/monorepo', import.meta.url));

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function isDirectoryEmpty(dir: string) {
  try {
    const files = await fs.readdir(dir);
    return files.length === 0;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return true;
    }
    throw error;
  }
}

async function copyRecursive(source: string, destination: string) {
  const entries = await fs.readdir(source, { withFileTypes: true });

  await ensureDir(destination);

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      const content = await fs.readFile(srcPath, 'utf8');
      await fs.writeFile(destPath, content, 'utf8');
    }
  }
}

function composeRootEnv(options: ScaffoldOptions, chainConfig: ChainConfig) {
  const lines: string[] = [
    '# Core infrastructure',
    'POSTGRES_URL=postgresql://makeabet:makeabet@localhost:5432/makeabet',
    'REDIS_URL=redis://default:makeabet@localhost:6379',
    'PAYPAL_CLIENT_ID=',
    'PAYPAL_CLIENT_SECRET=',
    'PYTH_PRICE_SERVICE_URL=https://hermes.pyth.network',
    `TARGET_CHAIN=${options.targetChain}`,
    `CHAIN_TYPE=${chainConfig.chainType}`,
    `ENABLE_MERCHANT_PORTAL=${options.includeMerchantModule}`,
    'WALLETCONNECT_PROJECT_ID=',
  ];

  if (chainConfig.chainType === 'evm') {
    lines.push(
      `PYUSD_CONTRACT_ADDRESS=${chainConfig.pyusdAddress ?? ''}`,
      'PYUSD_MINT_ADDRESS=',
      `EVM_CHAIN_ID=${chainConfig.chainId ?? ''}`,
      `EVM_RPC_URL=${chainConfig.defaultRpc}`,
      'SOLANA_RPC_URL='
    );
  } else {
    lines.push(
      'PYUSD_CONTRACT_ADDRESS=',
      `PYUSD_MINT_ADDRESS=${chainConfig.pyusdMint ?? ''}`,
      'EVM_CHAIN_ID=',
      'EVM_RPC_URL=',
      `SOLANA_RPC_URL=${chainConfig.defaultRpc}`
    );
  }

  return `${lines.join('\n')}\n`;
}

function composeWebEnv(chainConfig: ChainConfig) {
  const lines: string[] = [
    `VITE_TARGET_CHAIN=${chainConfig.id}`,
    `VITE_CHAIN_TYPE=${chainConfig.chainType}`,
    `VITE_WALLETCONNECT_PROJECT_ID=`,
  ];

  if (chainConfig.chainType === 'evm') {
    lines.push(
      `VITE_EVM_CHAIN_ID=${chainConfig.chainId ?? ''}`,
      `VITE_EVM_RPC_URL=${chainConfig.defaultRpc}`,
      `VITE_PYUSD_ADDRESS=${chainConfig.pyusdAddress ?? ''}`,
      'VITE_PYUSD_MINT=',
      'VITE_SOLANA_RPC_URL='
    );
  } else {
    lines.push(
      'VITE_EVM_CHAIN_ID=',
      'VITE_EVM_RPC_URL=',
      'VITE_PYUSD_ADDRESS=',
      `VITE_PYUSD_MINT=${chainConfig.pyusdMint ?? ''}`,
      `VITE_SOLANA_RPC_URL=${chainConfig.defaultRpc}`
    );
  }

  return `${lines.join('\n')}\n`;
}

async function writeConfigFiles(targetDir: string, options: ScaffoldOptions) {
  const chainConfig = CHAIN_CONFIG[options.targetChain];
  const rootEnv = composeRootEnv(options, chainConfig);
  const webEnv = composeWebEnv(chainConfig);

  await fs.writeFile(path.join(targetDir, '.env.example'), rootEnv, 'utf8');
  await fs.writeFile(path.join(targetDir, 'apps/web/.env.example'), webEnv, 'utf8');
  await fs.writeFile(path.join(targetDir, 'apps/api/.env.example'), rootEnv, 'utf8');
  await fs.writeFile(path.join(targetDir, 'apps/worker/.env.example'), rootEnv, 'utf8');
}

async function removeMerchantAssets(targetDir: string) {
  const merchantPaths = [
    'apps/web/src/modules/merchant',
    'apps/api/src/modules/merchant',
    'docs/templates/merchant-room.md'
  ];

  await Promise.all(
    merchantPaths.map(async (relativePath) => {
      const fullPath = path.join(targetDir, relativePath);
      await fs.rm(fullPath, { recursive: true, force: true });
    })
  );
}

function printSuccessMessage(options: ScaffoldOptions) {
  const { projectName, packageManager, includeMerchantModule } = options;
  const installCommand =
    packageManager === 'pnpm'
      ? 'pnpm install'
      : packageManager === 'yarn'
        ? 'yarn install'
        : 'npm install';
  const devCommand =
    packageManager === 'pnpm'
      ? 'pnpm dev'
      : packageManager === 'yarn'
        ? 'yarn dev'
        : 'npm run dev';

  console.log();
  console.log(chalk.green.bold('Success!'));
  console.log(`Scaffold created at ${chalk.cyan(projectName)}.`);
  console.log();
  console.log('Next steps:');
  console.log(`  cd ${projectName}`);
  console.log(`  ${installCommand}`);
  console.log('  docker compose up -d    # start Postgres & Redis');
  console.log(`  ${devCommand}`);
  console.log();
  console.log(`Merchant portal module ${includeMerchantModule ? chalk.green('enabled') : chalk.yellow('skipped')}.`);
  console.log('Ready to build the MakeABet demo and deploy to Railway!');
}

async function runScaffold(options: ScaffoldOptions) {
  const spinner = ora('Preparing MakeABet scaffold').start();
  const targetDir = path.resolve(process.cwd(), options.projectName);

  try {
    await ensureDir(targetDir);

    if (!(await isDirectoryEmpty(targetDir))) {
      throw new Error('Target directory is not empty. Please choose another folder.');
    }

    await copyRecursive(TEMPLATE_ROOT, targetDir);
    await writeConfigFiles(targetDir, options);

    if (!options.includeMerchantModule) {
      await removeMerchantAssets(targetDir);
    }

    spinner.succeed('Scaffold ready');
    printSuccessMessage(options);
  } catch (error) {
    spinner.fail('Failed to create scaffold');
    console.error(error);
    process.exitCode = 1;
  }
}

async function promptForMissingOptions(partial: Partial<ScaffoldOptions>): Promise<ScaffoldOptions> {
  const responses = await prompts([
    {
      type: partial.projectName ? null : 'text',
      name: 'projectName',
      message: '專案資料夾名稱？',
      initial: 'makeabet-app',
      validate: (value: string) => (value.trim().length === 0 ? '請輸入名稱' : true),
    },
    {
      type: partial.includeMerchantModule !== undefined ? null : 'toggle',
      name: 'includeMerchantModule',
      message: '要同時產生商家管理模組嗎？',
      initial: partial.includeMerchantModule ?? true,
      active: '是',
      inactive: '否',
    },
    {
      type: partial.targetChain ? null : 'select',
      name: 'targetChain',
      message: '目標鏈別？',
      choices: Object.values(CHAIN_CONFIG).map((config) => ({
        title: config.label,
        value: config.id,
      })),
      initial: 0,
    },
    {
      type: partial.packageManager ? null : 'select',
      name: 'packageManager',
      message: '要使用哪個套件管理器？',
      choices: [
        { title: 'pnpm', value: 'pnpm' },
        { title: 'npm', value: 'npm' },
        { title: 'yarn', value: 'yarn' }
      ],
      initial: 0,
    }
  ], {
    onCancel: () => {
      console.log('\n已取消建立腳手架');
      process.exit(0);
    }
  });

  return {
    projectName: partial.projectName ?? responses.projectName,
    includeMerchantModule: partial.includeMerchantModule ?? responses.includeMerchantModule,
    targetChain: (partial.targetChain ?? responses.targetChain) as TargetChain,
    packageManager: partial.packageManager ?? responses.packageManager,
  };
}

const program = new Command()
  .name('create-makeabet')
  .description('Generate a MakeABet-ready monorepo with Hardhat + Fastify + Railway presets')
  .argument('[projectName]', 'Directory name for the new project')
  .option('-m, --merchant', 'Include merchant portal module')
  .option('-c, --chain <chain>', 'Target chain id (sepolia | arbitrum-sepolia | solana-devnet)')
  .option('-p, --package-manager <pm>', 'Package manager (pnpm | npm | yarn)')
  .action(async (projectName: string | undefined, opts: Record<string, string | boolean | undefined>) => {
    const options = await promptForMissingOptions({
      projectName,
      includeMerchantModule: typeof opts.merchant === 'boolean' ? opts.merchant : undefined,
      targetChain: typeof opts.chain === 'string' ? (opts.chain as TargetChain) : undefined,
      packageManager: typeof opts.packageManager === 'string' ? (opts.packageManager as ScaffoldOptions['packageManager']) : undefined,
    });

    await runScaffold(options);
  });

program.parse(process.argv);
