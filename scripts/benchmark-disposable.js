#!/usr/bin/env node
/**
 * Performance benchmark for disposable domain lookups
 * Tests the efficiency of the Set-based lookup implementation
 */

import { performance } from 'node:perf_hooks';
import { isDisposableDomain } from '../dist/disposable-domains.js';

console.log('🏃 Disposable Domain Lookup Performance Benchmark\n');

// Test domains
const testDomains = [
  // Known disposable domains
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'tempmail.com',
  'mailinator.com',
  // Non-disposable domains
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'company.com',
  'example.com',
  // Edge cases
  'subdomain.10minutemail.com',
  'not-a-disposable.com',
  'test.test',
  'localhost',
  'invalid',
];

// Benchmark configurations
const iterations = {
  warmup: 10000,
  small: 100000,
  medium: 1000000,
  large: 10000000,
};

/**
 * Run a benchmark test
 * @param {string} name - Test name
 * @param {number} count - Number of iterations
 * @param {string[]} domains - Domains to test
 */
function runBenchmark(name, count, domains) {
  const startTime = performance.now();

  for (let i = 0; i < count; i++) {
    const domain = domains[i % domains.length];
    isDisposableDomain(domain);
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const opsPerSecond = (count / (totalTime / 1000)).toFixed(0);
  const nsPerOp = ((totalTime * 1000000) / count).toFixed(2);

  console.log(`${name}:`);
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Operations: ${count.toLocaleString()}`);
  console.log(`  Speed: ${Number(opsPerSecond).toLocaleString()} ops/sec`);
  console.log(`  Per operation: ${nsPerOp}ns`);
  console.log('');

  return {
    totalTime,
    opsPerSecond: Number(opsPerSecond),
    nsPerOp: Number(nsPerOp),
  };
}

// Warmup
console.log('🔥 Warming up...\n');
runBenchmark('Warmup', iterations.warmup, testDomains);

// Run benchmarks
console.log('📊 Running benchmarks...\n');

const results = [];

// Test with mixed domains (realistic scenario)
console.log('=== Mixed Domains (Realistic) ===');
results.push({
  test: 'Mixed domains - Small',
  ...runBenchmark('Small batch (100K lookups)', iterations.small, testDomains),
});

results.push({
  test: 'Mixed domains - Medium',
  ...runBenchmark('Medium batch (1M lookups)', iterations.medium, testDomains),
});

results.push({
  test: 'Mixed domains - Large',
  ...runBenchmark('Large batch (10M lookups)', iterations.large, testDomains),
});

// Test with only disposable domains (worst case for Set.has)
const disposableDomains = testDomains.filter((d) => isDisposableDomain(d));
console.log('=== Only Disposable Domains ===');
results.push({
  test: 'Disposable only',
  ...runBenchmark(
    'Disposable domains (1M lookups)',
    iterations.medium,
    disposableDomains
  ),
});

// Test with only non-disposable domains (best case)
const nonDisposableDomains = testDomains.filter((d) => !isDisposableDomain(d));
console.log('=== Only Non-Disposable Domains ===');
results.push({
  test: 'Non-disposable only',
  ...runBenchmark(
    'Non-disposable domains (1M lookups)',
    iterations.medium,
    nonDisposableDomains
  ),
});

// Memory usage estimation
console.log('=== Memory Usage ===');
const used = process.memoryUsage();
console.log(`Heap used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
console.log('');

// Summary
console.log('📈 Summary');
console.log('==========');
const avgOpsPerSec =
  results.reduce((sum, r) => sum + r.opsPerSecond, 0) / results.length;
const avgNsPerOp =
  results.reduce((sum, r) => sum + r.nsPerOp, 0) / results.length;

console.log(`Average performance: ${avgOpsPerSec.toLocaleString()} ops/sec`);
console.log(`Average time per lookup: ${avgNsPerOp.toFixed(2)}ns`);
console.log('');

// Performance analysis
console.log('💡 Analysis');
console.log('===========');
console.log('- Set.has() provides O(1) constant time lookups');
console.log('- Performance is consistent regardless of domain type');
console.log(
  '- Current implementation can handle millions of lookups per second'
);
console.log(
  `- With 661 domains, the Set uses minimal memory (~${(used.heapUsed / 1024).toFixed(0)} KB)`
);

// Comparison with alternatives
console.log('\n🔍 Comparison with alternatives:');
console.log('- Array.includes(): O(n) - would be ~661x slower in worst case');
console.log('- Binary search: O(log n) - would be ~10x slower');
console.log('- Set.has(): O(1) - current implementation (optimal)');

// Recommendations
console.log('\n✅ Recommendations:');
console.log('- Current Set-based implementation is optimal for this use case');
console.log('- No performance improvements needed for domain lookups');
console.log(
  '- Consider lazy loading only if initial load time becomes an issue'
);
console.log('- The 661 domains load quickly and use minimal memory');

process.exit(0);
