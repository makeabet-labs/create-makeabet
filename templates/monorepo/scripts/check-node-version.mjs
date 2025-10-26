#!/usr/bin/env node

/**
 * Check Node.js version before running commands
 * Hardhat 3 requires Node.js 22 or higher
 */

const requiredMajor = 22;
const currentVersion = process.version;
const currentMajor = parseInt(currentVersion.slice(1).split('.')[0], 10);

if (currentMajor < requiredMajor) {
  console.error(`\n❌ Error: Node.js ${requiredMajor} or higher is required for Hardhat 3`);
  console.error(`   Current version: ${currentVersion}`);
  console.error(`\n💡 To fix this:`);
  console.error(`   - Using nvm: nvm use 22 or nvm install 22`);
  console.error(`   - Using fnm: fnm use 22 or fnm install 22`);
  console.error(`   - Or download from: https://nodejs.org/\n`);
  process.exit(1);
}

console.log(`✅ Node.js version ${currentVersion} is compatible with Hardhat 3`);
