import { MxCache } from '../src/mx-cache.js';
import type { MxRecord } from '../src/types.js';

describe('MxCache', () => {
  let cache: MxCache;

  beforeEach(() => {
    cache = new MxCache();
  });

  describe('Basic functionality', () => {
    test('should store and retrieve MX records', () => {
      const domain = 'example.com';
      const records: MxRecord[] = [
        { exchange: 'mail1.example.com', priority: 10 },
        { exchange: 'mail2.example.com', priority: 20 },
      ];

      cache.set(domain, records);
      const retrieved = cache.get(domain);

      expect(retrieved).toEqual(records);
    });

    test('should return null for non-existent domain', () => {
      const result = cache.get('nonexistent.com');
      expect(result).toBeNull();
    });

    test('should handle case-insensitive domains', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      cache.set('Example.COM', records);
      expect(cache.get('example.com')).toEqual(records);
      expect(cache.get('EXAMPLE.COM')).toEqual(records);
      expect(cache.get('Example.com')).toEqual(records);
    });

    test('should update existing entries', () => {
      const domain = 'example.com';
      const oldRecords: MxRecord[] = [
        { exchange: 'old.example.com', priority: 10 },
      ];
      const newRecords: MxRecord[] = [
        { exchange: 'new.example.com', priority: 5 },
      ];

      cache.set(domain, oldRecords);
      cache.set(domain, newRecords);

      expect(cache.get(domain)).toEqual(newRecords);
    });
  });

  describe('TTL functionality', () => {
    test('should expire entries after TTL', async () => {
      const domain = 'example.com';
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Set with 50ms TTL
      cache.set(domain, records, 50);

      // Should exist immediately
      expect(cache.get(domain)).toEqual(records);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be expired
      expect(cache.get(domain)).toBeNull();
    });

    test('should use default TTL when not specified', async () => {
      // Create cache with short default TTL for testing
      cache = new MxCache({ defaultTtl: 50 });

      const domain = 'example.com';
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      cache.set(domain, records);

      // Should exist immediately
      expect(cache.get(domain)).toEqual(records);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be expired
      expect(cache.get(domain)).toBeNull();
    });

    test('should allow different TTLs for different entries', async () => {
      const domain1 = 'short.com';
      const domain2 = 'long.com';
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Set with different TTLs
      cache.set(domain1, records, 50); // 50ms
      cache.set(domain2, records, 200); // 200ms

      // Both should exist immediately
      expect(cache.get(domain1)).toEqual(records);
      expect(cache.get(domain2)).toEqual(records);

      // Wait for first to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // First should be expired, second still valid
      expect(cache.get(domain1)).toBeNull();
      expect(cache.get(domain2)).toEqual(records);

      // Wait for second to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Both should be expired
      expect(cache.get(domain2)).toBeNull();
    });
  });

  describe('Cache management', () => {
    test('should flush all entries', () => {
      const domains = ['example1.com', 'example2.com', 'example3.com'];
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Add multiple entries
      domains.forEach((domain) => cache.set(domain, records));

      // Verify all exist
      domains.forEach((domain) => {
        expect(cache.get(domain)).toEqual(records);
      });

      // Flush cache
      cache.flush();

      // Verify all are gone
      domains.forEach((domain) => {
        expect(cache.get(domain)).toBeNull();
      });
    });

    test('should delete specific domain', () => {
      const domain1 = 'keep.com';
      const domain2 = 'delete.com';
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      cache.set(domain1, records);
      cache.set(domain2, records);

      // Delete one domain
      const deleted = cache.delete(domain2);
      expect(deleted).toBe(true);

      // Verify one is gone, other remains
      expect(cache.get(domain1)).toEqual(records);
      expect(cache.get(domain2)).toBeNull();

      // Try deleting non-existent
      expect(cache.delete('nonexistent.com')).toBe(false);
    });

    test('should respect max size limit', () => {
      // Create cache with small limit
      cache = new MxCache({ maxSize: 3 });

      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Add entries up to limit
      cache.set('domain1.com', records);
      cache.set('domain2.com', records);
      cache.set('domain3.com', records);

      // All should exist
      expect(cache.get('domain1.com')).toEqual(records);
      expect(cache.get('domain2.com')).toEqual(records);
      expect(cache.get('domain3.com')).toEqual(records);

      // Add one more (should evict oldest)
      cache.set('domain4.com', records);

      // First should be evicted, others remain
      expect(cache.get('domain1.com')).toBeNull();
      expect(cache.get('domain2.com')).toEqual(records);
      expect(cache.get('domain3.com')).toEqual(records);
      expect(cache.get('domain4.com')).toEqual(records);
    });

    test('should clean expired entries', async () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Add entries with different TTLs
      cache.set('expired1.com', records, 50);
      cache.set('expired2.com', records, 50);
      cache.set('valid.com', records, 200);

      // Wait for some to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Clean expired
      const removed = cache.cleanExpired();
      expect(removed).toBe(2);

      // Check remaining
      expect(cache.get('expired1.com')).toBeNull();
      expect(cache.get('expired2.com')).toBeNull();
      expect(cache.get('valid.com')).toEqual(records);
    });

    test('should update statistics correctly when cleaning expired entries', async () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Add multiple entries with short TTL
      cache.set('exp1.com', records, 50);
      cache.set('exp2.com', records, 50);
      cache.set('exp3.com', records, 50);
      cache.set('valid.com', records, 200);

      // Verify initial size
      let stats = cache.getStatistics();
      expect(stats.size).toBe(4);
      expect(stats.evictions).toBe(0);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Call cleanExpired manually
      const removed = cache.cleanExpired();
      expect(removed).toBe(3);

      // Verify statistics are updated correctly
      stats = cache.getStatistics();
      expect(stats.size).toBe(1); // Only valid.com remains
      expect(stats.evictions).toBe(3); // 3 entries were evicted

      // Verify the remaining entry is correct
      expect(cache.get('valid.com')).toEqual(records);
    });

    test('should handle cleanExpired when cache is disabled', () => {
      cache = new MxCache({ enabled: false });
      const removed = cache.cleanExpired();
      expect(removed).toBe(0);
    });

    test('should handle cleanExpired with no expired entries', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Add entries with long TTL
      cache.set('valid1.com', records, 5000);
      cache.set('valid2.com', records, 5000);

      const removed = cache.cleanExpired();
      expect(removed).toBe(0);

      // Verify entries are still there
      expect(cache.get('valid1.com')).toEqual(records);
      expect(cache.get('valid2.com')).toEqual(records);
    });
  });

  describe('Statistics', () => {
    test('should track hits and misses', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      cache.set('example.com', records);

      // Initial stats
      let stats = cache.getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(1);

      // Hit
      cache.get('example.com');
      stats = cache.getStatistics();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);

      // Miss
      cache.get('nonexistent.com');
      stats = cache.getStatistics();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      // Another hit
      cache.get('example.com');
      stats = cache.getStatistics();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    test('should calculate hit rate correctly', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      cache.set('example.com', records);

      // No requests yet
      let stats = cache.getStatistics();
      expect(stats.hitRate).toBe(0);

      // 100% hit rate
      cache.get('example.com');
      cache.get('example.com');
      stats = cache.getStatistics();
      expect(stats.hitRate).toBe(100);

      // 66.67% hit rate (2 hits, 1 miss)
      cache.get('miss.com');
      stats = cache.getStatistics();
      expect(stats.hitRate).toBeCloseTo(66.67, 2);

      // 50% hit rate (2 hits, 2 misses)
      cache.get('miss2.com');
      stats = cache.getStatistics();
      expect(stats.hitRate).toBe(50);
    });

    test('should track evictions', async () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // TTL eviction
      cache.set('ttl.com', records, 50);
      await new Promise((resolve) => setTimeout(resolve, 60));
      cache.get('ttl.com'); // Triggers eviction

      let stats = cache.getStatistics();
      expect(stats.evictions).toBe(1);

      // Manual delete eviction
      cache.set('delete.com', records);
      cache.delete('delete.com');
      stats = cache.getStatistics();
      expect(stats.evictions).toBe(2);

      // Flush eviction
      cache.set('flush1.com', records);
      cache.set('flush2.com', records);
      cache.flush();
      stats = cache.getStatistics();
      expect(stats.evictions).toBe(4); // 2 + 2 from flush
    });

    test('should reset statistics', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Generate some stats
      cache.set('example.com', records);
      cache.get('example.com'); // hit
      cache.get('miss.com'); // miss
      cache.delete('example.com'); // eviction

      let stats = cache.getStatistics();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.evictions).toBe(1);

      // Reset
      cache.resetStatistics();
      stats = cache.getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      // Size should not be reset
      expect(stats.size).toBe(0); // 0 because we deleted the only entry
    });
  });

  describe('Cache disable', () => {
    test('should not cache when disabled', () => {
      cache = new MxCache({ enabled: false });

      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      cache.set('example.com', records);
      expect(cache.get('example.com')).toBeNull();

      const stats = cache.getStatistics();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    test('should check if enabled', () => {
      expect(cache.isEnabled()).toBe(true);

      const disabledCache = new MxCache({ enabled: false });
      expect(disabledCache.isEnabled()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty MX records', () => {
      const domain = 'example.com';
      const emptyRecords: MxRecord[] = [];

      cache.set(domain, emptyRecords);
      expect(cache.get(domain)).toEqual([]);
    });

    test('should handle very large number of records', () => {
      const domain = 'example.com';
      const records: MxRecord[] = Array.from({ length: 100 }, (_, i) => ({
        exchange: `mail${i}.example.com`,
        priority: i * 10,
      }));

      cache.set(domain, records);
      const retrieved = cache.get(domain);
      expect(retrieved).toEqual(records);
      expect(retrieved?.length).toBe(100);
    });

    test('should handle rapid get/set operations', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Rapid operations
      for (let i = 0; i < 1000; i++) {
        cache.set(`domain${i}.com`, records);
        expect(cache.get(`domain${i}.com`)).toEqual(records);
      }

      const stats = cache.getStatistics();
      expect(stats.hits).toBe(1000);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Comprehensive method tests', () => {
    test('delete method - comprehensive coverage', () => {
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Test deleting non-existent domain
      expect(cache.delete('nonexistent.com')).toBe(false);

      // Add and delete a domain
      cache.set('delete-test.com', records);
      const statsBefore = cache.getStatistics();
      const sizeBefore = statsBefore.size;

      expect(cache.delete('delete-test.com')).toBe(true);

      const statsAfter = cache.getStatistics();
      expect(statsAfter.size).toBe(sizeBefore - 1);
      expect(statsAfter.evictions).toBe(statsBefore.evictions + 1);

      // Verify domain is gone
      expect(cache.get('delete-test.com')).toBeNull();

      // Test case-insensitive deletion
      cache.set('CaSe-TeSt.com', records);
      expect(cache.delete('case-test.com')).toBe(true);
      expect(cache.get('CaSe-TeSt.com')).toBeNull();
    });

    test('isEnabled method - comprehensive coverage', () => {
      // Test default enabled state
      const defaultCache = new MxCache();
      expect(defaultCache.isEnabled()).toBe(true);

      // Test explicitly enabled
      const enabledCache = new MxCache({ enabled: true });
      expect(enabledCache.isEnabled()).toBe(true);

      // Test explicitly disabled
      const disabledCache = new MxCache({ enabled: false });
      expect(disabledCache.isEnabled()).toBe(false);

      // Test that disabled cache doesn't store
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];
      disabledCache.set('test.com', records);
      expect(disabledCache.get('test.com')).toBeNull();
    });

    test('cleanExpired method - comprehensive coverage', () => {
      // Test with empty cache
      const emptyCache = new MxCache();
      expect(emptyCache.cleanExpired()).toBe(0);

      // Test with no expired entries
      const freshCache = new MxCache({ defaultTtl: 5000 });
      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];
      freshCache.set('fresh1.com', records);
      freshCache.set('fresh2.com', records);
      expect(freshCache.cleanExpired()).toBe(0);

      // Test with mixed expired/valid entries
      const mixedCache = new MxCache();
      mixedCache.set('expire1.com', records, 1); // 1ms TTL
      mixedCache.set('expire2.com', records, 1); // 1ms TTL
      mixedCache.set('valid1.com', records, 5000); // 5s TTL

      // Wait for expiry
      const waitPromise = new Promise((resolve) => setTimeout(resolve, 10));
      return waitPromise.then(() => {
        const removed = mixedCache.cleanExpired();
        expect(removed).toBe(2);

        // Verify only valid entry remains
        expect(mixedCache.get('expire1.com')).toBeNull();
        expect(mixedCache.get('expire2.com')).toBeNull();
        expect(mixedCache.get('valid1.com')).toEqual(records);

        // Verify statistics
        const stats = mixedCache.getStatistics();
        expect(stats.size).toBe(1);
        expect(stats.evictions).toBeGreaterThanOrEqual(2);
      });
    });

    test('cleanExpired with disabled cache', () => {
      const disabledCache = new MxCache({ enabled: false });
      expect(disabledCache.cleanExpired()).toBe(0);
    });

    test('periodic cleanup can be disabled for deterministic behavior', () => {
      // Create cache with cleanup disabled
      const deterministicCache = new MxCache({
        maxSize: 100, // Large enough to not trigger evictions
        cleanupEnabled: false,
      });

      const records: MxRecord[] = [
        { exchange: 'mail.example.com', priority: 10 },
      ];

      // Add entries with very short TTL
      for (let i = 0; i < 10; i++) {
        deterministicCache.set(`expire${i}.com`, records, 1);
      }

      // Add entries with long TTL
      for (let i = 0; i < 10; i++) {
        deterministicCache.set(`valid${i}.com`, records, 5000);
      }

      // Wait for short TTL entries to expire
      const waitPromise = new Promise((resolve) => setTimeout(resolve, 10));
      return waitPromise.then(() => {
        // With cleanup disabled, expired entries should still be in cache
        const statsBefore = deterministicCache.getStatistics();
        expect(statsBefore.size).toBe(20); // All entries still in cache

        // Manually clean to verify expired entries exist
        const removed = deterministicCache.cleanExpired();
        expect(removed).toBe(10); // Only the expired entries

        const statsAfter = deterministicCache.getStatistics();
        expect(statsAfter.size).toBe(10); // Only valid entries remain
      });
    });
  });
});
