#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import prompts from 'prompts';
import chalk from 'chalk';

interface ScaffoldOptions {
  projectName: string;
  includeMerchantModule: boolean;
  targetChain: string;
  packageManager: 'pnpm' | 'npm' | 'yarn';
}

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

async function writeConfigFiles(targetDir: string, options: ScaffoldOptions) {
  const envPath = path.join(targetDir, '.env.example');
  const envContent = `# Core infrastructure\nPOSTGRES_URL=postgresql://makeabet:makeabet@localhost:5432/makeabet\nREDIS_URL=redis://default:makeabet@localhost:6379\nPAYPAL_CLIENT_ID=\nPAYPAL_CLIENT_SECRET=\nPYUSD_CONTRACT_ADDRESS=\nPYTH_PRICE_SERVICE_URL=https://hermes.pyth.network\nTARGET_CHAIN=${options.targetChain}\nENABLE_MERCHANT_PORTAL=${options.includeMerchantModule}\n`;

  await fs.writeFile(envPath, envContent, 'utf8');
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
  const pmExec = packageManager === 'pnpm' ? 'pnpm' : packageManager === 'yarn' ? 'yarn' : 'npm';

  console.log();
  console.log(chalk.green.bold('Success!'));
  console.log(`Scaffold created at ${chalk.cyan(projectName)}.`);
  console.log();
  console.log('Next steps:');
  console.log(`  cd ${projectName}`);
  if (packageManager === 'pnpm') {
    console.log('  pnpm install');
  } else if (packageManager === 'yarn') {
    console.log('  yarn install');
  } else {
    console.log('  npm install');
  }
  console.log(`  ${pmExec} run dev`);
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
      type: 'toggle',
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
      choices: [
        { title: 'Ethereum Sepolia', value: 'sepolia' },
        { title: 'Arbitrum Sepolia', value: 'arbitrum-sepolia' },
        { title: 'Base Sepolia', value: 'base-sepolia' }
      ],
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
    targetChain: partial.targetChain ?? responses.targetChain,
    packageManager: partial.packageManager ?? responses.packageManager,
  };
}

const program = new Command()
  .name('create-makeabet')
  .description('Generate a MakeABet-ready monorepo with Hardhat + Fastify + Railway presets')
  .argument('[projectName]', 'Directory name for the new project')
  .option('-m, --merchant', 'Include merchant portal module')
  .option('-c, --chain <chain>', 'Target chain id (sepolia | arbitrum-sepolia | base-sepolia)')
  .option('-p, --package-manager <pm>', 'Package manager (pnpm | npm | yarn)')
  .action(async (projectName: string | undefined, opts: Record<string, string | boolean | undefined>) => {
    const options = await promptForMissingOptions({
      projectName,
      includeMerchantModule: typeof opts.merchant === 'boolean' ? opts.merchant : undefined,
      targetChain: typeof opts.chain === 'string' ? opts.chain : undefined,
      packageManager: typeof opts.packageManager === 'string' ? (opts.packageManager as ScaffoldOptions['packageManager']) : undefined,
    });

    await runScaffold(options);
  });

program.parse(process.argv);
