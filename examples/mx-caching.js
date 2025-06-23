/**
 * MX Record Caching Example
 *
 * This example demonstrates how to use the built-in MX record caching
 * to improve performance for high-volume email validation scenarios.
 */

import emailValidator, { globalMxCache } from 'node-email-verifier';

// Example 1: Basic caching (enabled by default)
async function basicCachingExample() {
  console.log('\n=== Basic Caching Example ===');

  // First validation - will query DNS
  console.time('First validation');
  const result1 = await emailValidator('test@example.com', {
    checkMx: true,
    detailed: true,
  });
  console.timeEnd('First validation');
  console.log('Cached:', result1.mx?.cached); // false

  // Second validation - will use cache
  console.time('Second validation');
  const result2 = await emailValidator('test@example.com', {
    checkMx: true,
    detailed: true,
  });
  console.timeEnd('Second validation');
  console.log('Cached:', result2.mx?.cached); // true

  // Cache statistics
  console.log('Cache stats:', result2.cacheStats);
}

// Example 2: Custom cache configuration
async function customCacheConfig() {
  console.log('\n=== Custom Cache Configuration ===');

  // Clear cache first
  globalMxCache.flush();

  const result = await emailValidator('test@example.com', {
    checkMx: true,
    detailed: true,
    cache: {
      enabled: true,
      defaultTtl: 600000, // 10 minutes
      maxSize: 5000, // Store up to 5000 domains
    },
  });

  console.log('Valid:', result.valid);
  console.log('Cache stats:', result.cacheStats);
}

// Example 3: Bulk validation performance
async function bulkValidationExample() {
  console.log('\n=== Bulk Validation Performance ===');

  // Clear cache and stats
  globalMxCache.flush();
  globalMxCache.resetStatistics();

  // Generate test emails (same domain for cache demonstration)
  const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);

  // Validate without cache
  console.time('Without cache');
  for (const email of emails.slice(0, 10)) {
    await emailValidator(email, {
      checkMx: true,
      cache: { enabled: false },
    });
  }
  console.timeEnd('Without cache');

  // Validate with cache
  console.time('With cache');
  for (const email of emails) {
    await emailValidator(email, {
      checkMx: true,
      cache: { enabled: true },
    });
  }
  console.timeEnd('With cache');

  // Show cache effectiveness
  const stats = globalMxCache.getStatistics();
  console.log(`\nCache statistics:`);
  console.log(`- Hit rate: ${stats.hitRate}%`);
  console.log(`- Hits: ${stats.hits}`);
  console.log(`- Misses: ${stats.misses}`);
  console.log(`- Size: ${stats.size}`);
}

// Example 4: Cache management
async function cacheManagementExample() {
  console.log('\n=== Cache Management ===');

  // Validate some emails
  await emailValidator('test@example.com', { checkMx: true });
  await emailValidator('test@google.com', { checkMx: true });
  await emailValidator('test@github.com', { checkMx: true });

  // Check cache statistics
  let stats = globalMxCache.getStatistics();
  console.log('Cache size:', stats.size);

  // Clear specific domain
  globalMxCache.delete('example.com');
  stats = globalMxCache.getStatistics();
  console.log('Size after deleting example.com:', stats.size);

  // Clear entire cache
  globalMxCache.flush();
  stats = globalMxCache.getStatistics();
  console.log('Size after flush:', stats.size);

  // Reset statistics (keeps cached data)
  globalMxCache.resetStatistics();
  stats = globalMxCache.getStatistics();
  console.log('Stats after reset:', {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hitRate,
  });
}

// Example 5: TTL expiration
async function ttlExpirationExample() {
  console.log('\n=== TTL Expiration Example ===');

  // Clear cache
  globalMxCache.flush();

  // Validate with short TTL
  const result1 = await emailValidator('test@example.com', {
    checkMx: true,
    detailed: true,
    cache: {
      enabled: true,
      defaultTtl: 1000, // 1 second TTL
    },
  });
  console.log('First validation cached:', result1.mx?.cached); // false

  // Immediate second validation (within TTL)
  const result2 = await emailValidator('test@example.com', {
    checkMx: true,
    detailed: true,
  });
  console.log('Second validation cached:', result2.mx?.cached); // true

  // Wait for TTL to expire
  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Third validation (after TTL expiry)
  const result3 = await emailValidator('test@example.com', {
    checkMx: true,
    detailed: true,
  });
  console.log('Third validation cached:', result3.mx?.cached); // false
}

// Run all examples
async function runExamples() {
  try {
    await basicCachingExample();
    await customCacheConfig();
    await bulkValidationExample();
    await cacheManagementExample();
    await ttlExpirationExample();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export { basicCachingExample, customCacheConfig, bulkValidationExample };
