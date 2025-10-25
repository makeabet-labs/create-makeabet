#!/usr/bin/env node

/**
 * Comprehensive integration test script
 * Tests the complete local development workflow
 * Requirements: 2.5, 3.4, 5.7
 */

import { spawn } from 'child_process';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}\n${stderr}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function testDeploymentArtifacts() {
  logStep('1', 'Testing deployment artifacts');

  const artifactsPath = join(process.cwd(), 'apps/contracts/deployments/local.json');
  
  if (!(await fileExists(artifactsPath))) {
    logWarning('Deployment artifacts not found. Run `pnpm deploy:local` first.');
    return false;
  }

  try {
    const content = await readFile(artifactsPath, 'utf-8');
    const artifacts = JSON.parse(content);

    // Validate structure
    const requiredFields = ['pyusd', 'market', 'faucet'];
    for (const field of requiredFields) {
      if (!artifacts[field]) {
        logError(`Missing field: ${field}`);
        return false;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(artifacts[field])) {
        logError(`Invalid address format for ${field}: ${artifacts[field]}`);
        return false;
      }
    }

    logSuccess('Deployment artifacts are valid');
    logSuccess(`  PYUSD: ${artifacts.pyusd}`);
    logSuccess(`  Market: ${artifacts.market}`);
    logSuccess(`  Faucet: ${artifacts.faucet}`);
    return true;
  } catch (error) {
    logError(`Failed to parse deployment artifacts: ${error.message}`);
    return false;
  }
}

async function testEnvironmentSync() {
  logStep('2', 'Testing environment synchronization');

  const envPaths = [
    '.env.local',
    'apps/web/.env.local',
    'apps/api/.env.local',
  ];

  let allValid = true;

  for (const envPath of envPaths) {
    const fullPath = join(process.cwd(), envPath);
    if (!(await fileExists(fullPath))) {
      logWarning(`Environment file not found: ${envPath}`);
      allValid = false;
      continue;
    }

    try {
      const content = await readFile(fullPath, 'utf-8');
      
      // Check for required variables
      const requiredVars = ['LOCAL_PYUSD_ADDRESS', 'LOCAL_MARKET_ADDRESS'];
      for (const varName of requiredVars) {
        if (!content.includes(varName)) {
          logError(`Missing variable ${varName} in ${envPath}`);
          allValid = false;
        }
      }

      if (allValid) {
        logSuccess(`Environment file valid: ${envPath}`);
      }
    } catch (error) {
      logError(`Failed to read ${envPath}: ${error.message}`);
      allValid = false;
    }
  }

  return allValid;
}

async function testContractTests() {
  logStep('3', 'Running contract integration tests');

  try {
    await runCommand('pnpm', ['--filter', '@makeabet/contracts', 'test'], {
      cwd: process.cwd(),
    });
    logSuccess('Contract tests passed');
    return true;
  } catch (error) {
    logError(`Contract tests failed: ${error.message}`);
    return false;
  }
}

async function testWebIntegrationTests() {
  logStep('4', 'Running web integration tests');

  try {
    await runCommand('pnpm', ['--filter', '@makeabet/web', 'test', '--run'], {
      cwd: process.cwd(),
    });
    logSuccess('Web integration tests passed');
    return true;
  } catch (error) {
    logError(`Web integration tests failed: ${error.message}`);
    return false;
  }
}

async function testAPIIntegrationTests() {
  logStep('5', 'Running API integration tests');

  try {
    await runCommand('pnpm', ['--filter', '@makeabet/api', 'test', '--run'], {
      cwd: process.cwd(),
    });
    logSuccess('API integration tests passed');
    return true;
  } catch (error) {
    logError(`API integration tests failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('\n=== MakeABet Integration Test Suite ===\n', 'blue');
  log('This script tests the complete local development workflow', 'yellow');
  log('Make sure you have run `pnpm dev` or `pnpm deploy:local` first\n', 'yellow');

  const results = {
    artifacts: false,
    envSync: false,
    contractTests: false,
    webTests: false,
    apiTests: false,
  };

  // Run tests
  results.artifacts = await testDeploymentArtifacts();
  results.envSync = await testEnvironmentSync();
  results.contractTests = await testContractTests();
  results.webTests = await testWebIntegrationTests();
  results.apiTests = await testAPIIntegrationTests();

  // Summary
  log('\n=== Test Summary ===\n', 'blue');
  
  const tests = [
    ['Deployment Artifacts', results.artifacts],
    ['Environment Sync', results.envSync],
    ['Contract Tests', results.contractTests],
    ['Web Tests', results.webTests],
    ['API Tests', results.apiTests],
  ];

  let allPassed = true;
  for (const [name, passed] of tests) {
    if (passed) {
      logSuccess(`${name}: PASSED`);
    } else {
      logError(`${name}: FAILED`);
      allPassed = false;
    }
  }

  log('');
  if (allPassed) {
    log('🎉 All integration tests passed!', 'green');
    process.exit(0);
  } else {
    log('❌ Some integration tests failed', 'red');
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
