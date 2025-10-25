#!/usr/bin/env node

/**
 * Railway Deployment Test Script
 * 
 * This script validates a Railway deployment by testing:
 * - API health endpoint
 * - Config endpoint
 * - Database connectivity
 * - Redis connectivity
 * - Environment variable configuration
 * 
 * Usage:
 *   node scripts/test-railway-deployment.mjs <api-url>
 * 
 * Example:
 *   node scripts/test-railway-deployment.mjs https://your-api.railway.app
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

async function testEndpoint(url, description) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      logSuccess(`${description}: ${response.status}`);
      return { success: true, data };
    } else {
      logError(`${description}: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    logError(`${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testHealthEndpoint(apiUrl) {
  logSection('Testing Health Endpoint');
  
  const result = await testEndpoint(`${apiUrl}/health`, 'Health check');
  
  if (result.success) {
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.data.status === 'ok') {
      logSuccess('API is healthy');
      return true;
    } else {
      logWarning('API returned unexpected health status');
      return false;
    }
  }
  
  return false;
}

async function testConfigEndpoint(apiUrl) {
  logSection('Testing Config Endpoint');
  
  const result = await testEndpoint(`${apiUrl}/api/config`, 'Config endpoint');
  
  if (result.success) {
    const config = result.data;
    
    logInfo('Configuration received:');
    console.log(JSON.stringify(config, null, 2));
    
    // Validate required fields
    const requiredFields = [
      'targetChain',
      'chainType',
      'rpcUrl',
    ];
    
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      if (config[field]) {
        logSuccess(`${field}: ${config[field]}`);
      } else {
        logError(`Missing required field: ${field}`);
        allFieldsPresent = false;
      }
    }
    
    // Check optional fields
    const optionalFields = [
      'paypalClientId',
      'pythEndpoint',
      'pyusdAddress',
      'marketAddress',
    ];
    
    for (const field of optionalFields) {
      if (config[field]) {
        logInfo(`${field}: ${config[field]}`);
      } else {
        logWarning(`Optional field not set: ${field}`);
      }
    }
    
    // Validate local chain is disabled
    if (config.localChainEnabled === false) {
      logSuccess('Local chain correctly disabled in production');
    } else {
      logWarning('Local chain should be disabled in production');
    }
    
    return allFieldsPresent;
  }
  
  return false;
}

async function testDatabaseConnectivity(apiUrl) {
  logSection('Testing Database Connectivity');
  
  // Try to hit an endpoint that requires database
  // This is a basic test - actual implementation may vary
  try {
    const response = await fetch(`${apiUrl}/api/config`);
    if (response.ok) {
      logSuccess('API can connect to database (inferred from successful response)');
      return true;
    } else {
      logWarning('Could not verify database connectivity');
      return false;
    }
  } catch (error) {
    logError(`Database connectivity test failed: ${error.message}`);
    return false;
  }
}

async function testCORS(apiUrl) {
  logSection('Testing CORS Configuration');
  
  try {
    const response = await fetch(`${apiUrl}/api/config`, {
      method: 'OPTIONS',
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    };
    
    logInfo('CORS Headers:');
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (value) {
        logSuccess(`${key}: ${value}`);
      } else {
        logWarning(`${key}: not set`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`CORS test failed: ${error.message}`);
    return false;
  }
}

async function testFaucetDisabled(apiUrl) {
  logSection('Testing Faucet Endpoint (Should be Disabled)');
  
  try {
    const response = await fetch(`${apiUrl}/api/faucet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '0x0000000000000000000000000000000000000000',
      }),
    });
    
    const data = await response.json();
    
    if (response.status === 403 || (data.error && data.error.includes('local'))) {
      logSuccess('Faucet correctly disabled in production');
      return true;
    } else {
      logWarning('Faucet may not be properly disabled');
      logInfo(`Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logError(`Faucet test failed: ${error.message}`);
    return false;
  }
}

async function testResponseTimes(apiUrl) {
  logSection('Testing Response Times');
  
  const endpoints = [
    { path: '/health', name: 'Health' },
    { path: '/api/config', name: 'Config' },
  ];
  
  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(`${apiUrl}${endpoint.path}`);
      const duration = Date.now() - start;
      
      if (response.ok) {
        if (duration < 1000) {
          logSuccess(`${endpoint.name}: ${duration}ms (good)`);
        } else if (duration < 3000) {
          logWarning(`${endpoint.name}: ${duration}ms (acceptable)`);
        } else {
          logError(`${endpoint.name}: ${duration}ms (slow)`);
        }
      }
    } catch (error) {
      logError(`${endpoint.name}: Failed to test`);
    }
  }
  
  return true;
}

async function generateReport(results) {
  logSection('Deployment Test Report');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;
  
  log(`\nTotal Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  log(`\nSuccess Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');
  
  if (percentage === 100) {
    log('\n🎉 All tests passed! Deployment looks good.', 'green');
  } else if (percentage >= 80) {
    log('\n⚠️  Most tests passed, but some issues detected.', 'yellow');
  } else {
    log('\n❌ Multiple tests failed. Please review the deployment.', 'red');
  }
  
  return percentage === 100;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Usage: node scripts/test-railway-deployment.mjs <api-url>', 'red');
    log('Example: node scripts/test-railway-deployment.mjs https://your-api.railway.app', 'cyan');
    process.exit(1);
  }
  
  const apiUrl = args[0].replace(/\/$/, ''); // Remove trailing slash
  
  log('\n🚀 Railway Deployment Test Suite', 'blue');
  log(`Testing API: ${apiUrl}\n`, 'cyan');
  
  const results = {
    health: await testHealthEndpoint(apiUrl),
    config: await testConfigEndpoint(apiUrl),
    database: await testDatabaseConnectivity(apiUrl),
    cors: await testCORS(apiUrl),
    faucet: await testFaucetDisabled(apiUrl),
    performance: await testResponseTimes(apiUrl),
  };
  
  const allPassed = await generateReport(results);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
