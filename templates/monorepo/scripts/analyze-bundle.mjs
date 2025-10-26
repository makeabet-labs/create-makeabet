#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * 
 * This script analyzes the production build bundle sizes and provides
 * recommendations for optimization.
 * 
 * Usage:
 *   node scripts/analyze-bundle.mjs
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Size thresholds (in bytes)
const THRESHOLDS = {
  js: {
    warning: 200 * 1024,  // 200KB
    error: 500 * 1024,    // 500KB
  },
  css: {
    warning: 50 * 1024,   // 50KB
    error: 100 * 1024,    // 100KB
  },
  total: {
    warning: 1000 * 1024, // 1MB
    error: 2000 * 1024,   // 2MB
  },
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get color based on size and threshold
 */
function getColorForSize(size, type) {
  const threshold = THRESHOLDS[type];
  if (!threshold) return colors.reset;
  
  if (size >= threshold.error) return colors.red;
  if (size >= threshold.warning) return colors.yellow;
  return colors.green;
}

/**
 * Recursively get all files in a directory
 */
async function getFiles(dir, fileList = []) {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        await getFiles(filePath, fileList);
      } else {
        fileList.push({
          path: filePath,
          size: fileStat.size,
          name: file,
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist, skip
  }
  
  return fileList;
}

/**
 * Analyze bundle files
 */
async function analyzeBundle() {
  console.log(`${colors.bright}${colors.cyan}📦 Bundle Size Analysis${colors.reset}\n`);
  
  const distDir = join(rootDir, 'apps/web/dist');
  
  try {
    await stat(distDir);
  } catch (error) {
    console.log(`${colors.red}❌ Build not found. Run 'pnpm --filter @makeabet/web build' first.${colors.reset}\n`);
    process.exit(1);
  }
  
  const files = await getFiles(distDir);
  
  // Categorize files
  const jsFiles = files.filter(f => f.name.endsWith('.js'));
  const cssFiles = files.filter(f => f.name.endsWith('.css'));
  const otherFiles = files.filter(f => !f.name.endsWith('.js') && !f.name.endsWith('.css'));
  
  // Calculate totals
  const totalJsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  const totalCssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
  const totalOtherSize = otherFiles.reduce((sum, f) => sum + f.size, 0);
  const totalSize = totalJsSize + totalCssSize + totalOtherSize;
  
  // Sort by size
  jsFiles.sort((a, b) => b.size - a.size);
  cssFiles.sort((a, b) => b.size - a.size);
  
  // Display JavaScript files
  console.log(`${colors.bright}JavaScript Files:${colors.reset}`);
  console.log('─'.repeat(80));
  
  for (const file of jsFiles) {
    const color = getColorForSize(file.size, 'js');
    const relativePath = relative(distDir, file.path);
    const sizeStr = formatBytes(file.size).padStart(12);
    console.log(`${color}${sizeStr}${colors.reset}  ${relativePath}`);
  }
  
  const jsColor = getColorForSize(totalJsSize, 'js');
  console.log('─'.repeat(80));
  console.log(`${colors.bright}${jsColor}${formatBytes(totalJsSize).padStart(12)}${colors.reset}  ${colors.bright}Total JavaScript${colors.reset}\n`);
  
  // Display CSS files
  if (cssFiles.length > 0) {
    console.log(`${colors.bright}CSS Files:${colors.reset}`);
    console.log('─'.repeat(80));
    
    for (const file of cssFiles) {
      const color = getColorForSize(file.size, 'css');
      const relativePath = relative(distDir, file.path);
      const sizeStr = formatBytes(file.size).padStart(12);
      console.log(`${color}${sizeStr}${colors.reset}  ${relativePath}`);
    }
    
    const cssColor = getColorForSize(totalCssSize, 'css');
    console.log('─'.repeat(80));
    console.log(`${colors.bright}${cssColor}${formatBytes(totalCssSize).padStart(12)}${colors.reset}  ${colors.bright}Total CSS${colors.reset}\n`);
  }
  
  // Display summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log('─'.repeat(80));
  console.log(`JavaScript:      ${jsColor}${formatBytes(totalJsSize)}${colors.reset}`);
  console.log(`CSS:             ${getColorForSize(totalCssSize, 'css')}${formatBytes(totalCssSize)}${colors.reset}`);
  console.log(`Other:           ${formatBytes(totalOtherSize)}`);
  console.log('─'.repeat(80));
  
  const totalColor = getColorForSize(totalSize, 'total');
  console.log(`${colors.bright}Total:           ${totalColor}${formatBytes(totalSize)}${colors.reset}\n`);
  
  // Recommendations
  console.log(`${colors.bright}Recommendations:${colors.reset}`);
  console.log('─'.repeat(80));
  
  const recommendations = [];
  
  if (totalJsSize > THRESHOLDS.js.error) {
    recommendations.push(`${colors.red}⚠${colors.reset}  JavaScript bundle is very large (>${formatBytes(THRESHOLDS.js.error)})`);
    recommendations.push('   Consider code splitting, lazy loading, or removing unused dependencies');
  } else if (totalJsSize > THRESHOLDS.js.warning) {
    recommendations.push(`${colors.yellow}⚠${colors.reset}  JavaScript bundle is large (>${formatBytes(THRESHOLDS.js.warning)})`);
    recommendations.push('   Consider optimizing imports and using dynamic imports');
  }
  
  if (totalCssSize > THRESHOLDS.css.error) {
    recommendations.push(`${colors.red}⚠${colors.reset}  CSS bundle is very large (>${formatBytes(THRESHOLDS.css.error)})`);
    recommendations.push('   Consider removing unused styles or splitting CSS');
  } else if (totalCssSize > THRESHOLDS.css.warning) {
    recommendations.push(`${colors.yellow}⚠${colors.reset}  CSS bundle is large (>${formatBytes(THRESHOLDS.css.warning)})`);
    recommendations.push('   Consider optimizing CSS or using CSS-in-JS');
  }
  
  // Check for large individual chunks
  const largeChunks = jsFiles.filter(f => f.size > THRESHOLDS.js.warning);
  if (largeChunks.length > 0) {
    recommendations.push(`${colors.yellow}⚠${colors.reset}  ${largeChunks.length} large JavaScript chunk(s) detected`);
    recommendations.push('   Consider splitting large chunks or lazy loading components');
  }
  
  if (recommendations.length === 0) {
    console.log(`${colors.green}✓${colors.reset}  Bundle size looks good! No issues detected.\n`);
  } else {
    recommendations.forEach(rec => console.log(rec));
    console.log();
  }
  
  // Performance tips
  console.log(`${colors.bright}Performance Tips:${colors.reset}`);
  console.log('─'.repeat(80));
  console.log('• Use lazy loading for routes and heavy components');
  console.log('• Enable gzip/brotli compression on your server');
  console.log('• Use CDN for static assets');
  console.log('• Consider using dynamic imports for large libraries');
  console.log('• Run Lighthouse audit for detailed performance metrics');
  console.log('• Test on slow 3G network to ensure fast load times');
  console.log();
  
  // Exit with error if bundle is too large
  if (totalSize > THRESHOLDS.total.error) {
    console.log(`${colors.red}❌ Bundle size exceeds maximum threshold${colors.reset}\n`);
    process.exit(1);
  }
}

// Run analysis
analyzeBundle().catch(error => {
  console.error(`${colors.red}Error analyzing bundle:${colors.reset}`, error);
  process.exit(1);
});
