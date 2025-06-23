import emailValidator, { globalMxCache } from '../src/index.js';
import type { MxRecord } from '../src/types.js';
import type { ValidationResult } from '../src/index.js';

describe('MX Cache Integration', () => {
  // Mock DNS resolver
  const mockMxRecords: MxRecord[] = [
    { exchange: 'mail.example.com', priority: 10 },
    { exchange: 'mail2.example.com', priority: 20 },
  ];

  let resolveMxCallCount = 0;
  const mockResolveMx = async (hostname: string): Promise<MxRecord[]> => {
    resolveMxCallCount++;
    // Simulate DNS lookup delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (hostname === 'example.com') {
      return mockMxRecords;
    }
    throw new Error(`DNS lookup failed for ${hostname}`);
  };

  beforeEach(() => {
    // Clear cache and reset counter before each test
    globalMxCache.flush();
    globalMxCache.resetStatistics();
    resolveMxCallCount = 0;
  });

  describe('Cache functionality in emailValidator', () => {
    test('should use cache for repeated validations', async () => {
      const email = 'test@example.com';

      // First validation - cache miss
      const result1 = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true, defaultTtl: 5000 },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result1.valid).toBe(true);
      expect(result1.mx?.cached).toBe(false);
      expect(result1.cacheStats?.hits).toBe(0);
      expect(result1.cacheStats?.misses).toBe(1);
      expect(resolveMxCallCount).toBe(1);

      // Second validation - cache hit
      const result2 = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result2.valid).toBe(true);
      expect(result2.mx?.cached).toBe(true);
      expect(result2.cacheStats?.hits).toBe(1);
      expect(result2.cacheStats?.misses).toBe(1);
      expect(resolveMxCallCount).toBe(1); // No additional DNS lookup

      // Third validation - another cache hit
      const result3 = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result3.valid).toBe(true);
      expect(result3.mx?.cached).toBe(true);
      expect(result3.cacheStats?.hits).toBe(2);
      expect(result3.cacheStats?.misses).toBe(1);
      expect(result3.cacheStats?.hitRate).toBeCloseTo(66.67, 2);
      expect(resolveMxCallCount).toBe(1); // Still no additional DNS lookup
    });

    test('should respect cache TTL', async () => {
      const email = 'test@example.com';

      // First validation with short TTL
      await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true, defaultTtl: 50 }, // 50ms TTL
        _resolveMx: mockResolveMx,
      } as any);

      expect(resolveMxCallCount).toBe(1);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Second validation - should be cache miss due to expiry
      const result = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result.mx?.cached).toBe(false);
      expect(resolveMxCallCount).toBe(2); // New DNS lookup
    });

    test('should not use cache when disabled', async () => {
      const email = 'test@example.com';

      // First validation
      await emailValidator(email, {
        checkMx: true,
        cache: { enabled: false },
        _resolveMx: mockResolveMx,
      } as any);

      expect(resolveMxCallCount).toBe(1);

      // Second validation - should not use cache
      await emailValidator(email, {
        checkMx: true,
        cache: { enabled: false },
        _resolveMx: mockResolveMx,
      } as any);

      expect(resolveMxCallCount).toBe(2); // Another DNS lookup
    });

    test('should not include cache stats when not detailed', async () => {
      const email = 'test@example.com';

      const result = await emailValidator(email, {
        checkMx: true,
        detailed: false,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any);

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    test('should handle different domains independently', async () => {
      // Validate first domain
      await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any);

      expect(resolveMxCallCount).toBe(1);

      // Validate second domain (different) - should be cache miss
      const customResolver = async (hostname: string): Promise<MxRecord[]> => {
        resolveMxCallCount++;
        if (hostname === 'other.com') {
          return [{ exchange: 'mail.other.com', priority: 10 }];
        }
        throw new Error(`DNS lookup failed for ${hostname}`);
      };

      const result = (await emailValidator('test@other.com', {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: customResolver,
      } as any)) as ValidationResult;

      expect(result.mx?.cached).toBe(false);
      expect(resolveMxCallCount).toBe(2);

      // Validate first domain again - should be cache hit
      const result2 = (await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result2.mx?.cached).toBe(true);
      expect(resolveMxCallCount).toBe(2); // No additional lookup
    });

    test('should cache domains with no MX records', async () => {
      const failResolver = async (): Promise<MxRecord[]> => {
        resolveMxCallCount++;
        return []; // No MX records
      };

      // First validation
      const result1 = (await emailValidator('test@nomx.com', {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: failResolver,
      } as any)) as ValidationResult;

      expect(result1.valid).toBe(false);
      expect(result1.mx?.cached).toBe(false);
      expect(result1.mx?.records).toEqual([]);
      expect(resolveMxCallCount).toBe(1);

      // Second validation - should use cached empty result
      const result2 = (await emailValidator('test@nomx.com', {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: failResolver,
      } as any)) as ValidationResult;

      expect(result2.valid).toBe(false);
      expect(result2.mx?.cached).toBe(true);
      expect(result2.mx?.records).toEqual([]);
      expect(resolveMxCallCount).toBe(1); // No additional lookup
    });

    test('should use cache even with custom resolver', async () => {
      // Cache works with custom resolver for better testing
      const email = 'test@example.com';

      // First validation with custom resolver
      const result1 = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(resolveMxCallCount).toBe(1);
      expect(result1.mx?.cached).toBe(false);

      // Second validation with custom resolver - should use cache
      const result2 = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(resolveMxCallCount).toBe(1); // No additional lookup
      expect(result2.mx?.cached).toBe(true);
    });
  });

  describe('Cache management', () => {
    test('should allow manual cache flush', async () => {
      const email = 'test@example.com';

      // First validation
      await emailValidator(email, {
        checkMx: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any);

      expect(resolveMxCallCount).toBe(1);

      // Flush cache
      globalMxCache.flush();

      // Second validation - should be cache miss
      const result = (await emailValidator(email, {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result.mx?.cached).toBe(false);
      expect(resolveMxCallCount).toBe(2);
    });

    test('should allow clearing specific domain', async () => {
      // Validate two domains
      await emailValidator('test@example.com', {
        checkMx: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any);

      const otherResolver = async (): Promise<MxRecord[]> => {
        resolveMxCallCount++;
        return [{ exchange: 'mail.other.com', priority: 10 }];
      };

      await emailValidator('test@other.com', {
        checkMx: true,
        cache: { enabled: true },
        _resolveMx: otherResolver,
      } as any);

      expect(resolveMxCallCount).toBe(2);

      // Clear one domain
      globalMxCache.delete('example.com');

      // Validate first domain - should be cache miss
      await emailValidator('test@example.com', {
        checkMx: true,
        cache: { enabled: true },
        _resolveMx: mockResolveMx,
      } as any);

      expect(resolveMxCallCount).toBe(3);

      // Validate second domain - should be cache hit
      const result = (await emailValidator('test@other.com', {
        checkMx: true,
        detailed: true,
        cache: { enabled: true },
        _resolveMx: otherResolver,
      } as any)) as ValidationResult;

      expect(result.mx?.cached).toBe(true);
      expect(resolveMxCallCount).toBe(3); // No additional lookup
    });
  });

  describe('Performance', () => {
    test('should significantly improve performance for bulk validations', async () => {
      const emails = Array.from(
        { length: 100 },
        (_, i) => `user${i}@example.com`
      );

      // Time without cache
      globalMxCache.flush();
      const startNoCache = Date.now();

      for (const email of emails) {
        await emailValidator(email, {
          checkMx: true,
          cache: { enabled: false },
          _resolveMx: mockResolveMx,
        } as any);
      }

      const timeNoCache = Date.now() - startNoCache;
      const callsNoCache = resolveMxCallCount;

      // Reset
      resolveMxCallCount = 0;
      globalMxCache.flush();

      // Time with cache
      const startWithCache = Date.now();

      for (const email of emails) {
        await emailValidator(email, {
          checkMx: true,
          cache: { enabled: true },
          _resolveMx: mockResolveMx,
        } as any);
      }

      const timeWithCache = Date.now() - startWithCache;
      const callsWithCache = resolveMxCallCount;

      // Cache should result in only 1 DNS lookup vs 100
      expect(callsNoCache).toBe(100);
      expect(callsWithCache).toBe(1);

      // Cache should be significantly faster (at least 50% improvement)
      expect(timeWithCache).toBeLessThan(timeNoCache * 0.5);
    });
  });
});
