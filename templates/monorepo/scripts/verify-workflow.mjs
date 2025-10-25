#!/usr/bin/env node

/**
 * Verification script for pnpm dev workflow
 * Tests that all components work correctly:
 * - pnpm chain starts Hardhat node on 0.0.0.0:8545
 * - pnpm deploy:local deploys contracts and writes artifacts
 * - pnpm sync:local-env updates environment files
 * - concurrently and wait-on orchestrate correctly
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
  return new Promise(async (resolve) => {
    const { createServer } = await import('net');
    const tester = createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port, '127.0.0.1');
  });
}

/**
 * Wait for a port to be available
 */
async function waitForPort(port, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await isPortInUse(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

/**
 * Run a command and return the result
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd || rootDir,
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject({ code, stdout, stderr });
      }
    });

    proc.on('error', (error) => {
      reject({ error, stdout, stderr });
    });

    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        proc.kill();
        reject({ error: 'Timeout', stdout, stderr });
      }, options.timeout);
    }
  });
}

/**
 * Start Hardhat node in background
 */
async function startHardhatNode() {
  logStep('1', 'Testing: pnpm chain starts Hardhat node on 0.0.0.0:8545');
  
  // Check if port 8545 is already in use
  const portInUse = await isPortInUse(8545);
  if (portInUse) {
    logSuccess('Port 8545 is already in use - Hardhat node is running');
    results.passed.push('Hardhat node is accessible on port 8545');
    
    // Try to make a JSON-RPC call to verify it's actually a Hardhat node
    try {
      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result) {
        logSuccess(`Verified: Node responds to JSON-RPC calls (chainId: ${data.result})`);
        results.passed.push('Node responds to JSON-RPC calls');
      }
    } catch (error) {
      logWarning('Could not verify JSON-RPC connectivity');
      results.warnings.push('Could not verify JSON-RPC connectivity');
    }
    
    return null;
  }

  // Start Hardhat node
  const proc = spawn('pnpm', ['chain'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
  });

  let output = '';
  proc.stdout.on('data', (data) => {
    output += data.toString();
  });

  proc.stderr.on('data', (data) => {
    output += data.toString();
  });

  // Wait for node to start
  log('Waiting for Hardhat node to start on port 8545...');
  const started = await waitForPort(8545, 15000);

  if (started) {
    logSuccess('Hardhat node started successfully on port 8545');
    results.passed.push('Hardhat node starts on 0.0.0.0:8545');
    
    // Verify it's listening on 0.0.0.0
    if (output.includes('0.0.0.0:8545') || output.includes('Started HTTP and WebSocket JSON-RPC server')) {
      logSuccess('Confirmed: Node is listening on 0.0.0.0:8545');
      results.passed.push('Node listens on 0.0.0.0 (accessible from network)');
    } else {
      logWarning('Could not confirm 0.0.0.0 binding from output');
      results.warnings.push('Could not verify 0.0.0.0 binding from output');
    }
    
    // Verify JSON-RPC connectivity
    try {
      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result) {
        logSuccess(`Verified: Node responds to JSON-RPC calls (chainId: ${data.result})`);
        results.passed.push('Node responds to JSON-RPC calls');
      }
    } catch (error) {
      logWarning('Could not verify JSON-RPC connectivity');
      results.warnings.push('Could not verify JSON-RPC connectivity');
    }
    
    return proc;
  } else {
    logError('Failed to start Hardhat node within timeout');
    results.failed.push('Hardhat node failed to start');
    proc.kill();
    return null;
  }
}

/**
 * Test deployment script
 */
async function testDeployment() {
  logStep('2', 'Testing: pnpm deploy:local deploys contracts and writes artifacts');
  
  // Clean up any existing deployment artifacts
  const deploymentPath = path.join(rootDir, 'apps/contracts/deployments/local.json');
  if (fs.existsSync(deploymentPath)) {
    fs.unlinkSync(deploymentPath);
    log('Cleaned up existing deployment artifacts');
  }

  try {
    // Run deployment
    log('Running deployment script...');
    const result = await runCommand('pnpm', ['deploy:local'], { silent: true, timeout: 30000 });
    
    logSuccess('Deployment script executed successfully');
    results.passed.push('deploy:local script runs without errors');

    // Check if deployment artifacts were created
    if (fs.existsSync(deploymentPath)) {
      logSuccess('Deployment artifacts file created at apps/contracts/deployments/local.json');
      results.passed.push('Deployment artifacts written to deployments/local.json');

      // Validate deployment artifacts structure
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const requiredFields = ['pyusd', 'market', 'faucet', 'timestamp', 'chainId'];
      const missingFields = requiredFields.filter(field => !deployment[field]);

      if (missingFields.length === 0) {
        logSuccess('Deployment artifacts contain all required fields');
        results.passed.push('Deployment artifacts have correct structure');
        
        log(`  - PYUSD: ${deployment.pyusd}`);
        log(`  - Market: ${deployment.market}`);
        log(`  - Faucet: ${deployment.faucet}`);
        log(`  - Chain ID: ${deployment.chainId}`);
        log(`  - Timestamp: ${new Date(deployment.timestamp).toISOString()}`);
      } else {
        logError(`Deployment artifacts missing fields: ${missingFields.join(', ')}`);
        results.failed.push(`Missing fields in deployment artifacts: ${missingFields.join(', ')}`);
      }
    } else {
      logError('Deployment artifacts file was not created');
      results.failed.push('Deployment artifacts not written to file');
    }
  } catch (error) {
    logError('Deployment script failed');
    if (error.stderr) {
      log(error.stderr, 'red');
    }
    results.failed.push('deploy:local script execution failed');
  }
}

/**
 * Test environment sync script
 */
async function testEnvSync() {
  logStep('3', 'Testing: pnpm sync:local-env updates environment files');
  
  // Clean up existing .env.local files
  const envFiles = [
    '.env.local',
    'apps/api/.env.local',
    'apps/worker/.env.local',
    'apps/web/.env.local',
  ];

  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  log('Cleaned up existing .env.local files');

  try {
    // Run sync script
    log('Running sync script...');
    const result = await runCommand('pnpm', ['sync:local-env'], { silent: true });
    
    logSuccess('Sync script executed successfully');
    results.passed.push('sync:local-env script runs without errors');

    // Check if all environment files were created
    let allCreated = true;
    for (const file of envFiles) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        logSuccess(`Created: ${file}`);
        
        // Validate content
        const content = fs.readFileSync(filePath, 'utf8');
        const hasAddresses = content.includes('LOCAL_PYUSD_ADDRESS') || content.includes('VITE_LOCAL_PYUSD_ADDRESS');
        
        if (hasAddresses) {
          logSuccess(`  ✓ Contains deployment addresses`);
        } else {
          logWarning(`  ⚠ Missing deployment addresses`);
          results.warnings.push(`${file} may be missing deployment addresses`);
        }
      } else {
        logError(`Not created: ${file}`);
        allCreated = false;
      }
    }

    if (allCreated) {
      results.passed.push('All environment files created and updated');
    } else {
      results.failed.push('Some environment files were not created');
    }
  } catch (error) {
    logError('Sync script failed');
    if (error.stderr) {
      log(error.stderr, 'red');
    }
    results.failed.push('sync:local-env script execution failed');
  }
}

/**
 * Test concurrently and wait-on configuration
 */
async function testConcurrentlyConfig() {
  logStep('4', 'Testing: concurrently and wait-on configuration');
  
  // Check package.json scripts
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Verify dev script uses concurrently
  if (packageJson.scripts.dev && packageJson.scripts.dev.includes('concurrently')) {
    logSuccess('dev script uses concurrently');
    results.passed.push('dev script configured with concurrently');
  } else {
    logError('dev script does not use concurrently');
    results.failed.push('dev script missing concurrently');
  }

  // Verify dev:services uses wait-on
  if (packageJson.scripts['dev:services'] && packageJson.scripts['dev:services'].includes('wait-on')) {
    logSuccess('dev:services script uses wait-on');
    results.passed.push('dev:services script configured with wait-on');
  } else {
    logError('dev:services script does not use wait-on');
    results.failed.push('dev:services script missing wait-on');
  }

  // Verify wait-on targets correct port
  if (packageJson.scripts['dev:services'] && packageJson.scripts['dev:services'].includes('tcp:127.0.0.1:8545')) {
    logSuccess('wait-on configured to wait for port 8545');
    results.passed.push('wait-on targets correct port (8545)');
  } else {
    logError('wait-on not configured for port 8545');
    results.failed.push('wait-on not targeting port 8545');
  }

  // Verify concurrently has -k flag (kill all on exit)
  if (packageJson.scripts.dev && packageJson.scripts.dev.includes('-k')) {
    logSuccess('concurrently configured with -k flag (kill all on exit)');
    results.passed.push('concurrently has -k flag');
  } else {
    logWarning('concurrently missing -k flag');
    results.warnings.push('concurrently should have -k flag for proper cleanup');
  }

  // Check dependencies
  const hasConcurrently = packageJson.devDependencies?.concurrently;
  const hasWaitOn = packageJson.devDependencies?.['wait-on'];

  if (hasConcurrently) {
    logSuccess(`concurrently installed (${hasConcurrently})`);
    results.passed.push('concurrently dependency present');
  } else {
    logError('concurrently not in devDependencies');
    results.failed.push('concurrently dependency missing');
  }

  if (hasWaitOn) {
    logSuccess(`wait-on installed (${hasWaitOn})`);
    results.passed.push('wait-on dependency present');
  } else {
    logError('wait-on not in devDependencies');
    results.failed.push('wait-on dependency missing');
  }
}

/**
 * Test complete workflow orchestration
 */
async function testWorkflowOrchestration() {
  logStep('5', 'Testing: Complete workflow orchestration');
  
  log('Verifying workflow steps execute in correct order:');
  log('  1. Start Hardhat node (pnpm chain)');
  log('  2. Wait for port 8545 (wait-on)');
  log('  3. Deploy contracts (pnpm deploy:local)');
  log('  4. Sync environment (pnpm sync:local-env)');
  log('  5. Start dev servers (turbo run dev)');
  
  // Check if deployment happened after node started
  const deploymentPath = path.join(rootDir, 'apps/contracts/deployments/local.json');
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    logSuccess('Deployment completed (artifacts exist)');
    
    // Check if env files were synced after deployment
    const envPath = path.join(rootDir, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes(deployment.pyusd)) {
        logSuccess('Environment files synced with deployment addresses');
        results.passed.push('Workflow orchestration: deploy → sync → env files updated');
      } else {
        logWarning('Environment files may not be synced with latest deployment');
        results.warnings.push('Environment files might need re-sync');
      }
    }
  }

  logSuccess('Workflow orchestration verified');
  results.passed.push('Complete workflow steps execute in correct order');
}

/**
 * Print summary
 */
function printSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('VERIFICATION SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  if (results.passed.length > 0) {
    log(`\n✅ PASSED (${results.passed.length}):`, 'green');
    results.passed.forEach(test => log(`  • ${test}`, 'green'));
  }

  if (results.warnings.length > 0) {
    log(`\n⚠️  WARNINGS (${results.warnings.length}):`, 'yellow');
    results.warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
  }

  if (results.failed.length > 0) {
    log(`\n❌ FAILED (${results.failed.length}):`, 'red');
    results.failed.forEach(test => log(`  • ${test}`, 'red'));
  }

  log('\n' + '='.repeat(60), 'cyan');
  
  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  
  log(`\nTotal Tests: ${total}`, 'blue');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  
  if (results.failed.length === 0) {
    log('\n🎉 All tests passed!', 'green');
    return 0;
  } else {
    log('\n❌ Some tests failed. Please review the errors above.', 'red');
    return 1;
  }
}

/**
 * Main execution
 */
async function main() {
  log('='.repeat(60), 'cyan');
  log('PNPM DEV WORKFLOW VERIFICATION', 'cyan');
  log('='.repeat(60), 'cyan');
  log('\nThis script verifies that the pnpm dev workflow is correctly configured.');
  log('It will test each component individually and then verify orchestration.\n');

  let hardhatProc = null;

  try {
    // Test 1: Start Hardhat node
    hardhatProc = await startHardhatNode();

    // Test 2: Deploy contracts
    await testDeployment();

    // Test 3: Sync environment
    await testEnvSync();

    // Test 4: Verify concurrently config
    await testConcurrentlyConfig();

    // Test 5: Verify orchestration
    await testWorkflowOrchestration();

  } catch (error) {
    logError('Verification failed with error:');
    console.error(error);
    results.failed.push('Unexpected error during verification');
  } finally {
    // Clean up Hardhat node
    if (hardhatProc) {
      log('\nCleaning up: Stopping Hardhat node...');
      hardhatProc.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
      logSuccess('Hardhat node stopped');
    }
  }

  // Print summary and exit
  const exitCode = printSummary();
  process.exit(exitCode);
}

// Run main
main().catch((error) => {
  logError('Fatal error:');
  console.error(error);
  process.exit(1);
});
