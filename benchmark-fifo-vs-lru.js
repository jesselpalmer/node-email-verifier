#!/usr/bin/env node

/**
 * FIFO vs LRU Cache Strategy Comparison
 * Tests the actual performance difference between FIFO and LRU eviction strategies
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

// FIFO Cache implementation (for comparison)
class FifoCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.statistics = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };
    this.options = {
      enabled: options.enabled !== false,
      defaultTtl: options.defaultTtl || 300000, // 5 minutes
      maxSize: options.maxSize || 1000,
    };
  }

  get(domain) {
    if (!this.options.enabled) {
      return null;
    }

    const key = domain.toLowerCase();
    const entry = this.cache.get(key);

    if (!entry) {
      this.statistics.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      this.statistics.size--;
      this.statistics.evictions++;
      this.statistics.misses++;
      return null;
    }

    // FIFO: No re-ordering on access
    this.statistics.hits++;
    return entry.records;
  }

  set(domain, records, ttl) {
    if (!this.options.enabled) {
      return;
    }

    const key = domain.toLowerCase();

    // Check cache size limit
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      // FIFO eviction: Remove first entry (oldest)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.statistics.size--;
        this.statistics.evictions++;
      }
    }

    const wasUpdate = this.cache.has(key);

    this.cache.set(key, {
      records,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTtl,
    });

    if (!wasUpdate) {
      this.statistics.size++;
    }
  }

  getStatistics() {
    const total = this.statistics.hits + this.statistics.misses;
    const hitRate = total > 0 ? (this.statistics.hits / total) * 100 : 0;

    return {
      ...this.statistics,
      hitRate: parseFloat(hitRate.toFixed(2)),
    };
  }

  flush() {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.statistics.size = 0;
    this.statistics.evictions += previousSize;
  }

  resetStatistics() {
    this.statistics.hits = 0;
    this.statistics.misses = 0;
    this.statistics.evictions = 0;
  }
}

function benchmarkFIFO() {
  console.log('🔄 Benchmarking FIFO Cache Strategy...');

  const cache = new FifoCache({ maxSize: CACHE_SIZE, enabled: true });
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
    strategy: 'FIFO',
    totalRequests: TOTAL_REQUESTS,
    hits,
    misses,
    hitRate: (hits / TOTAL_REQUESTS) * 100,
    evictions: stats.evictions,
    executionTime: end - start,
    avgTimePerRequest: (end - start) / TOTAL_REQUESTS,
  };
}

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

async function runEvictionComparison() {
  console.log('🚀 FIFO vs LRU Eviction Strategy Comparison\n');
  console.log(`Configuration:`);
  console.log(`- Cache Size: ${CACHE_SIZE}`);
  console.log(`- Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`- Unique Domains: ${UNIQUE_DOMAINS}`);
  console.log(`- Access Pattern: 60% popular, 30% medium, 10% rare\n`);

  // Run FIFO benchmark multiple times for accuracy
  const fifoResults = [];
  for (let i = 0; i < 5; i++) {
    fifoResults.push(benchmarkFIFO());
  }

  // Run LRU benchmark multiple times for accuracy
  const lruResults = [];
  for (let i = 0; i < 5; i++) {
    lruResults.push(benchmarkLRU());
  }

  // Calculate averages
  const avgFifo = {
    strategy: 'FIFO',
    hitRate:
      fifoResults.reduce((sum, r) => sum + r.hitRate, 0) / fifoResults.length,
    evictions:
      fifoResults.reduce((sum, r) => sum + r.evictions, 0) / fifoResults.length,
    executionTime:
      fifoResults.reduce((sum, r) => sum + r.executionTime, 0) /
      fifoResults.length,
    avgTimePerRequest:
      fifoResults.reduce((sum, r) => sum + r.avgTimePerRequest, 0) /
      fifoResults.length,
  };

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

  console.log('📊 Eviction Strategy Comparison:\n');

  console.log('🔄 FIFO (First In, First Out):');
  console.log(`   Hit Rate: ${avgFifo.hitRate.toFixed(2)}%`);
  console.log(`   Evictions: ${avgFifo.evictions.toFixed(0)}`);
  console.log(`   Execution Time: ${avgFifo.executionTime.toFixed(2)}ms`);
  console.log(
    `   Avg Time/Request: ${avgFifo.avgTimePerRequest.toFixed(4)}ms\n`
  );

  console.log('⚡ LRU (Least Recently Used):');
  console.log(`   Hit Rate: ${avgLru.hitRate.toFixed(2)}%`);
  console.log(`   Evictions: ${avgLru.evictions.toFixed(0)}`);
  console.log(`   Execution Time: ${avgLru.executionTime.toFixed(2)}ms`);
  console.log(
    `   Avg Time/Request: ${avgLru.avgTimePerRequest.toFixed(4)}ms\n`
  );

  // Calculate improvements
  const hitRateImprovement =
    ((avgLru.hitRate - avgFifo.hitRate) / avgFifo.hitRate) * 100;
  const evictionReduction =
    ((avgFifo.evictions - avgLru.evictions) / avgFifo.evictions) * 100;
  const dnsReductionFifo = (avgFifo.hitRate / 100) * TOTAL_REQUESTS;
  const dnsReductionLru = (avgLru.hitRate / 100) * TOTAL_REQUESTS;
  const additionalDnsSavings = dnsReductionLru - dnsReductionFifo;

  console.log('📈 LRU Improvements over FIFO:');
  console.log(
    `   Hit Rate: +${hitRateImprovement.toFixed(1)}% (${(avgLru.hitRate - avgFifo.hitRate).toFixed(2)} percentage points)`
  );
  console.log(
    `   Evictions: -${evictionReduction.toFixed(1)}% (${(avgFifo.evictions - avgLru.evictions).toFixed(0)} fewer)`
  );
  console.log(
    `   Additional DNS Lookups Avoided: ${additionalDnsSavings.toFixed(0)}`
  );
  console.log(
    `   Additional Time Saved: ${((additionalDnsSavings * 75) / 1000).toFixed(1)}s (at 75ms/lookup)\n`
  );

  console.log('🎯 Why LRU Performs Better:');
  console.log('• Keeps frequently accessed domains in cache longer');
  console.log('• Adapts to access patterns (popular domains stay cached)');
  console.log('• Reduces eviction of still-useful cache entries');
  console.log(
    '• Better for real-world usage patterns with domain popularity\n'
  );

  return { avgFifo, avgLru };
}

// Run the eviction strategy comparison
runEvictionComparison().catch(console.error);
