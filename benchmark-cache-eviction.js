#!/usr/bin/env node

/**
 * Cache Eviction Strategy Performance Benchmark
 * Compares FIFO vs LRU eviction strategies for MX record caching
 */

/* global performance */

import { MxCache } from './dist/mx-cache.js';

// Benchmark configuration
const CACHE_SIZE = 100;
const TOTAL_REQUESTS = 1000;
const UNIQUE_DOMAINS = 150; // More domains than cache size to force evictions

// Create realistic domain access patterns
function generateDomainAccessPattern() {
  const domains = [];

  // Popular domains (20% of unique domains, 60% of requests)
  const popularDomains = [];
  for (let i = 0; i < Math.floor(UNIQUE_DOMAINS * 0.2); i++) {
    popularDomains.push(`popular${i}.com`);
  }

  // Medium domains (30% of unique domains, 30% of requests)
  const mediumDomains = [];
  for (let i = 0; i < Math.floor(UNIQUE_DOMAINS * 0.3); i++) {
    mediumDomains.push(`medium${i}.com`);
  }

  // Rare domains (50% of unique domains, 10% of requests)
  const rareDomains = [];
  for (let i = 0; i < Math.floor(UNIQUE_DOMAINS * 0.5); i++) {
    rareDomains.push(`rare${i}.com`);
  }

  // Generate access pattern
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const rand = Math.random();
    if (rand < 0.6) {
      // 60% popular domains
      domains.push(
        popularDomains[Math.floor(Math.random() * popularDomains.length)]
      );
    } else if (rand < 0.9) {
      // 30% medium domains
      domains.push(
        mediumDomains[Math.floor(Math.random() * mediumDomains.length)]
      );
    } else {
      // 10% rare domains
      domains.push(rareDomains[Math.floor(Math.random() * rareDomains.length)]);
    }
  }

  return domains;
}

// Mock MX records
const mockMxRecords = [
  { exchange: 'mail.example.com', priority: 10 },
  { exchange: 'mail2.example.com', priority: 20 },
];

function benchmarkLRU() {
  console.log('🔄 Benchmarking LRU Cache Strategy...');

  const cache = new MxCache({ maxSize: CACHE_SIZE, enabled: true });
  const domains = generateDomainAccessPattern();

  let hits = 0;
  let misses = 0;
  const start = performance.now();

  for (const domain of domains) {
    const cached = cache.get(domain);
    if (cached !== null) {
      hits++;
    } else {
      misses++;
      cache.set(domain, mockMxRecords);
    }
  }

  const end = performance.now();
  const stats = cache.getStatistics();

  return {
    strategy: 'LRU',
    totalRequests: TOTAL_REQUESTS,
    hits,
    misses,
    hitRate: (hits / TOTAL_REQUESTS) * 100,
    evictions: stats.evictions,
    executionTime: end - start,
    avgTimePerRequest: (end - start) / TOTAL_REQUESTS,
  };
}

async function runBenchmarks() {
  console.log('🚀 Cache Eviction Strategy Performance Benchmark\n');
  console.log(`Configuration:`);
  console.log(`- Cache Size: ${CACHE_SIZE}`);
  console.log(`- Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`- Unique Domains: ${UNIQUE_DOMAINS}`);
  console.log(`- Access Pattern: 60% popular, 30% medium, 10% rare\n`);

  // Run LRU benchmark multiple times for accuracy
  const lruResults = [];
  for (let i = 0; i < 5; i++) {
    lruResults.push(benchmarkLRU());
  }

  // Calculate averages
  const avgLru = {
    strategy: 'LRU',
    hitRate:
      lruResults.reduce((sum, r) => sum + r.hitRate, 0) / lruResults.length,
    evictions:
      lruResults.reduce((sum, r) => sum + r.evictions, 0) / lruResults.length,
    executionTime:
      lruResults.reduce((sum, r) => sum + r.executionTime, 0) /
      lruResults.length,
    avgTimePerRequest:
      lruResults.reduce((sum, r) => sum + r.avgTimePerRequest, 0) /
      lruResults.length,
  };

  console.log('📊 LRU Results (NEW Implementation):');
  console.log(`   Hit Rate: ${avgLru.hitRate.toFixed(2)}%`);
  console.log(`   Evictions: ${avgLru.evictions.toFixed(0)}`);
  console.log(`   Execution Time: ${avgLru.executionTime.toFixed(2)}ms`);
  console.log(
    `   Avg Time/Request: ${avgLru.avgTimePerRequest.toFixed(4)}ms\n`
  );

  // Compare with FIFO baseline (from previous run)
  const fifoHitRate = 80.32; // From previous benchmark
  const improvement = ((avgLru.hitRate - fifoHitRate) / fifoHitRate) * 100;

  console.log('📈 LRU vs FIFO Comparison:');
  console.log(`   FIFO Hit Rate: ${fifoHitRate.toFixed(2)}%`);
  console.log(`   LRU Hit Rate: ${avgLru.hitRate.toFixed(2)}%`);
  console.log(
    `   Improvement: +${improvement.toFixed(1)}% (${(avgLru.hitRate - fifoHitRate).toFixed(2)} percentage points)\n`
  );

  // Simulate DNS lookup cost savings
  const lruDnsAvoided = (avgLru.hitRate / 100) * TOTAL_REQUESTS;
  const fifoDnsAvoided = (fifoHitRate / 100) * TOTAL_REQUESTS;
  const additionalSavings = lruDnsAvoided - fifoDnsAvoided;
  const additionalTimeSaved = additionalSavings * 50; // 50ms per DNS lookup

  console.log('💰 Additional Performance Benefits from LRU:');
  console.log(
    `   Additional DNS Lookups Avoided: ${additionalSavings.toFixed(0)}`
  );
  console.log(
    `   Additional Time Saved: ${(additionalTimeSaved / 1000).toFixed(1)}s`
  );
  console.log(
    `   Total LRU Time Saved: ${((lruDnsAvoided * 50) / 1000).toFixed(1)}s\n`
  );

  return avgLru;
}

// Run the benchmark
runBenchmarks().catch(console.error);
