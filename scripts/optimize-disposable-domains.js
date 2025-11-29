#!/usr/bin/env node

/**
 * Optimizes the disposable domains list for production
 * This script generates a compact representation of the domains
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the original domains file
const domainsPath = join(__dirname, '../src/disposable-domains.ts');
const content = readFileSync(domainsPath, 'utf8');

// Extract the domains array
const domainsMatch = content.match(
  /export const disposableDomains = new Set\(\[([\s\S]*?)\]\);/
);
if (!domainsMatch) {
  throw new Error('Could not find disposableDomains in source file');
}

// Parse domains
const domainsString = domainsMatch[1];
const domains = domainsString
  .split(',')
  .map((line) => line.trim())
  .filter((line) => line)
  .map((line) => line.replace(/['"]/g, ''))
  .filter((domain) => domain && !domain.startsWith('//'));

console.log(`Found ${domains.length} disposable domains`);

// Create optimized version with common suffix extraction
const suffixMap = new Map();

domains.forEach((domain) => {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const suffix = parts.slice(-2).join('.');
    const prefix = parts.slice(0, -2).join('.');

    if (!suffixMap.has(suffix)) {
      suffixMap.set(suffix, []);
    }

    if (prefix) {
      suffixMap.get(suffix).push(prefix);
    } else {
      suffixMap.get(suffix).push('');
    }
  }
});

// Generate optimized code
let optimizedCode = `// Auto-generated optimized disposable domains list
// Generated on ${new Date().toISOString()}
// Original domains: ${domains.length}

`;

// For now, just create a more compact representation
optimizedCode += `export const disposableDomains = new Set([${domains.map((d) => `'${d}'`).join(',')}]);`;

// Write optimized version
const outputPath = join(__dirname, '../src/disposable-domains-optimized.ts');
writeFileSync(outputPath, optimizedCode);

// Calculate size difference
const originalSize = content.length;
const optimizedSize = optimizedCode.length;
const savings = originalSize - optimizedSize;
const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

console.log(`Original size: ${originalSize} bytes`);
console.log(`Optimized size: ${optimizedSize} bytes`);
console.log(`Savings: ${savings} bytes (${savingsPercent}%)`);
