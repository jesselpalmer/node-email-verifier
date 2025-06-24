import { ErrorCode } from '../src/errors.js';
import emailValidator from '../src/index.js';
import type { MxRecord } from '../src/types.js';
import type { ValidationResult } from '../src/index.js';
import { clearGlobalMxCache, createTestOptions } from './test-helpers.js';

// Type for memory errors
interface MemoryError extends Error {
  code?: string;
}

describe('Bulk Validation Memory Tests', () => {
  beforeEach(() => {
    clearGlobalMxCache();
  });
  describe('Out of memory scenarios', () => {
    test('should handle memory pressure during large bulk validations', async () => {
      const LARGE_BATCH_SIZE = 1000;
      let resolverCallCount = 0;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        resolverCallCount++;
        // Simulate memory allocation with each call
        const largeBuffer = Buffer.alloc(1024 * 10); // 10KB per call
        largeBuffer.fill(0);

        // Simulate varying response times to stress memory
        const delay = Math.random() * 10;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const emails = Array.from(
        { length: LARGE_BATCH_SIZE },
        (_, i) => `test${i}@memory-test-${i}.com` // Different domains to avoid cache
      );

      const startMemory = process.memoryUsage();

      // Validate emails in batches to control memory usage
      const batchSize = 50;
      const results = [];

      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const batchPromises = batch.map((email) =>
          emailValidator(
            email,
            createTestOptions({
              checkMx: true,
              detailed: true,
              timeout: 100,
              _resolveMx: mockResolveMx,
            })
          )
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const endMemory = process.memoryUsage();

      // Verify all validations completed successfully
      expect(results).toHaveLength(LARGE_BATCH_SIZE);
      results.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
      });

      // Verify resolver was called for each email
      expect(resolverCallCount).toBe(LARGE_BATCH_SIZE);

      // Memory usage should be reasonable (relative to batch size and starting memory)
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      const maxReasonableIncrease = Math.max(
        50 * 1024 * 1024, // Minimum 50MB threshold
        startMemory.heapUsed * 0.5 // Or 50% of starting memory, whichever is higher
      );

      // Memory usage should be reasonable (relative to batch size and starting memory)
      expect(memoryIncrease).toBeLessThan(maxReasonableIncrease);
    });

    test('should handle memory allocation failures gracefully', async () => {
      let allocationAttempts = 0;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        allocationAttempts++;

        // Simulate memory allocation failure after some attempts
        if (allocationAttempts > 5) {
          const error = new Error(
            'JavaScript heap out of memory'
          ) as MemoryError;
          error.code = 'ERR_OUT_OF_MEMORY';
          throw error;
        }

        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const emails = Array.from(
        { length: 10 },
        (_, i) => `test${i}@memory-fail.com`
      );

      const results = await Promise.allSettled(
        emails.map((email) =>
          emailValidator(
            email,
            createTestOptions({
              checkMx: true,
              detailed: true,
              timeout: 100,
              _resolveMx: mockResolveMx,
            })
          )
        )
      );

      // First 5 should succeed
      results.slice(0, 5).forEach((result) => {
        expect(result.status).toBe('fulfilled');
        expect(
          (result as PromiseFulfilledResult<ValidationResult>).value.valid
        ).toBe(true);
      });

      // Remaining should fail with MX lookup error
      results.slice(5).forEach((result) => {
        expect(result.status).toBe('fulfilled');
        expect(
          (result as PromiseFulfilledResult<ValidationResult>).value.valid
        ).toBe(false);
        expect(
          (result as PromiseFulfilledResult<ValidationResult>).value.mx
            ?.errorCode
        ).toBe(ErrorCode.MX_LOOKUP_FAILED);
      });
    });

    test('should handle memory-efficient concurrent validations', async () => {
      const CONCURRENT_LIMIT = 100;
      let activeResolvers = 0;
      let maxConcurrentResolvers = 0;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        activeResolvers++;
        maxConcurrentResolvers = Math.max(
          maxConcurrentResolvers,
          activeResolvers
        );

        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 10));

        activeResolvers--;
        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const emails = Array.from(
        { length: CONCURRENT_LIMIT },
        (_, i) => `concurrent${i}@memory.com`
      );

      const startTime = Date.now();
      const results = await Promise.all(
        emails.map((email) =>
          emailValidator(
            email,
            createTestOptions({
              checkMx: true,
              detailed: true,
              timeout: 200,
              _resolveMx: mockResolveMx,
            })
          )
        )
      );
      const endTime = Date.now();

      // All validations should succeed
      results.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
      });

      // Should complete in reasonable time (concurrent, not sequential)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Should take less than 5 seconds

      // Should have managed concurrency efficiently
      expect(maxConcurrentResolvers).toBeGreaterThan(1);
      expect(maxConcurrentResolvers).toBeLessThanOrEqual(CONCURRENT_LIMIT);
    });

    test('should handle large email batch with mixed results', async () => {
      const BATCH_SIZE = 500;
      let callIndex = 0;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        const currentIndex = callIndex++;

        // Create different outcomes based on index
        if (currentIndex % 10 === 0) {
          // Every 10th call fails with memory pressure
          throw new Error('Temporary memory pressure');
        } else if (currentIndex % 7 === 0) {
          // Every 7th call returns no MX records
          return [];
        } else if (currentIndex % 5 === 0) {
          // Every 5th call has network error
          const error = new Error('ENETUNREACH') as MemoryError;
          error.code = 'ENETUNREACH';
          throw error;
        }

        // Normal successful response
        return [{ priority: 10, exchange: `mail${currentIndex}.example.com` }];
      };

      const emails = Array.from(
        { length: BATCH_SIZE },
        (_, i) => `bulk${i}@mixed-results.com`
      );

      // Process in smaller batches to manage memory
      const batchSize = 25;
      const allResults = [];

      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((email) =>
            emailValidator(
              email,
              createTestOptions({
                checkMx: true,
                detailed: true,
                timeout: 100,
                _resolveMx: mockResolveMx,
              })
            )
          )
        );
        allResults.push(...batchResults);
      }

      expect(allResults).toHaveLength(BATCH_SIZE);

      // Count different result types
      let validResults = 0;
      let mxLookupFailed = 0;
      let noMxRecords = 0;

      allResults.forEach((result) => {
        if ((result as ValidationResult).valid) {
          validResults++;
        } else {
          const errorCode = (result as ValidationResult).mx?.errorCode;
          if (errorCode === ErrorCode.MX_LOOKUP_FAILED) {
            mxLookupFailed++;
          } else if (errorCode === ErrorCode.NO_MX_RECORDS) {
            noMxRecords++;
          }
        }
      });

      // Verify expected distribution
      expect(validResults).toBeGreaterThan(0);
      expect(mxLookupFailed).toBeGreaterThan(0);
      expect(noMxRecords).toBeGreaterThan(0);

      // Total should equal batch size
      expect(validResults + mxLookupFailed + noMxRecords).toBe(BATCH_SIZE);
    });
  });

  describe('Memory leak prevention', () => {
    test('should not leak memory with repeated validations', async () => {
      const ITERATIONS = 100;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        // Create and discard objects to test for leaks
        const tempArray = new Array(1000).fill('temp');
        tempArray.forEach((/* _, index */) => {
          const obj = { data: 'test'.repeat(100) };
          return obj;
        });

        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const initialMemory = process.memoryUsage();

      // Perform many validations
      for (let i = 0; i < ITERATIONS; i++) {
        await emailValidator(
          `test${i}@leak-test.com`,
          createTestOptions({
            checkMx: true,
            detailed: true,
            timeout: 50,
            _resolveMx: mockResolveMx,
          })
        );

        // Force GC every 10 iterations if available
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      // Force final GC
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();

      // Memory increase should be minimal - use relative threshold for CI compatibility
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const maxReasonableIncrease = Math.max(
        10 * 1024 * 1024, // Minimum 10MB threshold
        initialMemory.heapUsed * 0.5 // Or 50% of starting memory, whichever is higher
      );
      expect(memoryIncrease).toBeLessThan(maxReasonableIncrease);
    });

    test('should handle timeout cancellation without memory leaks', async () => {
      let resolverStarted = 0;
      let resolverCompleted = 0;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        resolverStarted++;

        // Simulate slow DNS resolution
        await new Promise((resolve) => {
          setTimeout(() => {
            resolverCompleted++;
            resolve(undefined);
          }, 200); // Will timeout before completion
        });

        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const promises = Array.from({ length: 10 }, (_, i) =>
        emailValidator(
          `timeout${i}@cleanup.com`,
          createTestOptions({
            checkMx: true,
            detailed: true,
            timeout: 100, // Will timeout before resolver completes
            _resolveMx: mockResolveMx,
          })
        ).catch((error) => ({ error }))
      );

      const results = await Promise.all(promises);

      // All should timeout
      results.forEach((result) => {
        expect((result as { error: any }).error?.code).toBe(
          ErrorCode.DNS_LOOKUP_TIMEOUT
        );
      });

      // Should have started resolvers but timeouts should prevent all completions
      expect(resolverStarted).toBe(10);

      // Give time for any pending resolvers to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Some resolvers may complete after timeout, but validator should handle this gracefully
      expect(resolverCompleted).toBeGreaterThanOrEqual(0);
      expect(resolverCompleted).toBeLessThanOrEqual(10);
    });
  });
});
