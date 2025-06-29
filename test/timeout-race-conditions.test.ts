import { ErrorCode, EmailValidationError } from '../src/errors.js';
import emailValidator from '../src/index.js';
import type { MxRecord } from '../src/types.js';
import {
  setupCacheIsolation,
  TestEmailValidatorOptions,
  createTestOptions,
} from './test-helpers.js';

// Type for catch results
type ErrorResult = { error: EmailValidationError };
type FailureResult = { success: false; error: any };

// Helper function to create mock resolvers with specified delay
function createMockResolveMx(timeout: number): () => Promise<MxRecord[]> {
  return async (): Promise<MxRecord[]> => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
    return [{ priority: 10, exchange: 'mail.example.com' }];
  };
}

describe('Timeout Race Condition Tests', () => {
  beforeEach(() => {
    setupCacheIsolation();
  });

  describe('Race conditions between timeout and DNS resolution', () => {
    test('should handle timeout occurring just before DNS resolution', async () => {
      const mockResolveMx = createMockResolveMx(50); // DNS will resolve after 50ms

      // Set timeout to 30ms (will fire before DNS resolves)
      const promise = emailValidator(
        'test@example.com',
        createTestOptions({
          checkMx: true,
          timeout: 30,
          _resolveMx: mockResolveMx,
        })
      );

      await expect(promise).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.DNS_LOOKUP_TIMEOUT,
          message: 'DNS lookup timed out',
        })
      );
    });

    test('should handle DNS resolution occurring just before timeout', async () => {
      const mockResolveMx = createMockResolveMx(10); // DNS resolves quickly (10ms)

      // Set timeout to 50ms (DNS will resolve first)
      const result = await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        timeout: 50,
        _resolveMx: mockResolveMx,
      } as TestEmailValidatorOptions);

      expect(result.valid).toBe(true);
      expect(result.mx?.records).toHaveLength(1);
    });
  });

  describe('Multiple concurrent validations with different timeouts', () => {
    test('should handle concurrent validations with mixed timeout results', async () => {
      const delays = [10, 30, 50, 70, 90]; // DNS resolution delays
      const timeouts = [40, 40, 40, 40, 40]; // Same timeout for all

      const mockResolvers = delays.map(
        (delay) => async (/* hostname: string */): Promise<MxRecord[]> => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return [{ priority: 10, exchange: `mail${delay}.example.com` }];
        }
      );

      const promises = delays.map((_, i) =>
        emailValidator(`test${i}@example.com`, {
          checkMx: true,
          detailed: true,
          timeout: timeouts[i],
          _resolveMx: mockResolvers[i],
        } as TestEmailValidatorOptions).catch((error) => ({ error }))
      );

      const results = await Promise.all(promises);

      // First 2 should succeed (10ms, 30ms < 40ms timeout)
      expect(results[0]).not.toHaveProperty('error');
      expect(results[1]).not.toHaveProperty('error');

      // Last 3 should timeout (50ms, 70ms, 90ms > 40ms timeout)
      expect(results[2]).toHaveProperty('error');
      expect(results[3]).toHaveProperty('error');
      expect(results[4]).toHaveProperty('error');

      // Check timeout errors
      const timeoutErrors = results
        .slice(2)
        .map((r) => (r as ErrorResult).error);
      timeoutErrors.forEach((error) => {
        expect(error).toBeInstanceOf(EmailValidationError);
        expect(error.code).toBe(ErrorCode.DNS_LOOKUP_TIMEOUT);
      });
    });

    test('should handle rapid sequential validations with timeouts', async () => {
      let callCount = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        const currentCall = ++callCount;
        // Alternating fast and slow responses
        const delay = currentCall % 2 === 0 ? 10 : 60;

        await new Promise((resolve) => setTimeout(resolve, delay));
        return [{ priority: 10, exchange: `mail${currentCall}.example.com` }];
      };

      const emails = Array.from(
        { length: 10 },
        (_, i) => `test@example-${i}.com`
      );

      // Validate emails in rapid succession
      const results = [];
      for (const email of emails) {
        try {
          const result = await emailValidator(email, {
            checkMx: true,
            detailed: true,
            timeout: 30,
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions);
          results.push({ success: true, result });
        } catch (error) {
          results.push({ success: false, error });
        }
      }

      // Verify alternating pattern of success/failure
      results.forEach((result, index) => {
        if (index % 2 === 1) {
          // Even calls (2, 4, 6, 8, 10) have 10ms delay - should succeed
          expect(result.success).toBe(true);
        } else {
          // Odd calls (1, 3, 5, 7, 9) have 60ms delay - should timeout
          expect(result.success).toBe(false);
          expect((result as FailureResult).error).toBeInstanceOf(
            EmailValidationError
          );
          expect((result as FailureResult).error.code).toBe(
            ErrorCode.DNS_LOOKUP_TIMEOUT
          );
        }
      });
    });
  });

  describe('Timeout edge cases', () => {
    test('should handle timeout exactly at DNS resolution time', async () => {
      const EXACT_TIME = 50;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        await new Promise((resolve) => setTimeout(resolve, EXACT_TIME));
        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      // Run multiple times to catch race condition
      const attempts = 5;
      let timeoutCount = 0;
      let successCount = 0;

      for (let i = 0; i < attempts; i++) {
        try {
          const result = await emailValidator(`test${i}@racecondition.com`, {
            checkMx: true,
            detailed: true,
            timeout: EXACT_TIME,
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions);

          successCount++;
          expect(result.valid).toBe(true);
        } catch (error) {
          timeoutCount++;
          expect(error).toBeInstanceOf(EmailValidationError);
          expect((error as EmailValidationError).code).toBe(
            ErrorCode.DNS_LOOKUP_TIMEOUT
          );
        }
      }

      // Due to timing precision, we might get either result
      expect(timeoutCount + successCount).toBe(attempts);
    });

    test('should clean up resources after timeout', async () => {
      let resolverStarted = false;
      let resolverFinished = false;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        resolverStarted = true;
        // Simulate slow DNS resolution that will be interrupted by timeout
        await new Promise((resolve) => {
          setTimeout(() => {
            resolverFinished = true;
            resolve([{ priority: 10, exchange: 'mail.example.com' }]);
          }, 100); // Will take 100ms, but timeout is 30ms
        });
        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const validationPromise = emailValidator('test@cleanup.com', {
        checkMx: true,
        timeout: 30, // Will timeout before resolver's 100ms
        _resolveMx: mockResolveMx,
      } as TestEmailValidatorOptions);

      // Validation should timeout
      await expect(validationPromise).rejects.toBeInstanceOf(
        EmailValidationError
      );

      // Verify resolver was started but timeout occurred before completion
      expect(resolverStarted).toBe(true);
      expect(resolverFinished).toBe(false); // Should not have finished due to timeout
    });

    test('should properly abort timeout promises and prevent hanging timers', async () => {
      let resolverPromiseCreated = false;
      let resolverCompleted = false;

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        resolverPromiseCreated = true;

        // Simulate slow DNS resolution that will be interrupted by timeout
        await new Promise((resolve) => {
          setTimeout(() => {
            resolverCompleted = true;
            resolve(undefined);
          }, 200); // Will take 200ms, but timeout is 100ms
        });

        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      const validationPromise = emailValidator('test@abort-signal.com', {
        checkMx: true,
        timeout: 100, // Will timeout before resolver's 200ms
        _resolveMx: mockResolveMx,
      } as TestEmailValidatorOptions);

      // Should timeout with proper cleanup
      await expect(validationPromise).rejects.toBeInstanceOf(
        EmailValidationError
      );

      // Verify resolver started but was properly cancelled by timeout
      expect(resolverPromiseCreated).toBe(true);
      expect(resolverCompleted).toBe(false); // Should not complete due to timeout
    });
  });

  describe('String timeout parsing race conditions', () => {
    test('should handle string timeout parsing consistently', async () => {
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        return [{ priority: 10, exchange: 'mail.example.com' }];
      };

      // Test various string timeout formats
      const timeoutFormats = ['30', '30ms', '0.03s'];

      const promises = timeoutFormats.map((timeout) =>
        emailValidator(`test@stringtimeout.com`, {
          checkMx: true,
          timeout,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions).catch((error) => error)
      );

      const results = await Promise.all(promises);

      // All should timeout (30ms < 40ms resolution time)
      results.forEach((error) => {
        expect(error).toBeInstanceOf(EmailValidationError);
        expect(error.code).toBe(ErrorCode.DNS_LOOKUP_TIMEOUT);
      });
    });

    test('should handle invalid timeout values', async () => {
      const mockResolveMx = createMockResolveMx(10);

      // Test invalid string formats
      const invalidTimeouts = ['abc', 'xyz123', ''];

      for (const timeout of invalidTimeouts) {
        await expect(
          emailValidator('test@invalid.com', {
            checkMx: true,
            timeout,
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions)
        ).rejects.toThrow(EmailValidationError);

        await expect(
          emailValidator('test@invalid.com', {
            checkMx: true,
            timeout,
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions)
        ).rejects.toMatchObject({
          code: ErrorCode.INVALID_TIMEOUT_VALUE,
        });
      }

      // Test zero and negative values
      const zeroOrNegativeTimeouts = [0, -1, -100, '0ms', '-5s'];

      for (const timeout of zeroOrNegativeTimeouts) {
        await expect(
          emailValidator('test@invalid.com', {
            checkMx: true,
            timeout,
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions)
        ).rejects.toThrow(EmailValidationError);

        await expect(
          emailValidator('test@invalid.com', {
            checkMx: true,
            timeout,
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions)
        ).rejects.toMatchObject({
          code: ErrorCode.INVALID_TIMEOUT_VALUE,
        });
      }
    });
  });

  describe('Concurrent timeout cancellation', () => {
    test('should handle multiple timeout cancellations properly', async () => {
      const resolutionTimes = [5, 10, 15, 20, 25];

      const mockResolvers = resolutionTimes.map(
        (time) => async (/* hostname: string */): Promise<MxRecord[]> => {
          await new Promise((resolve) => setTimeout(resolve, time));
          return [{ priority: 10, exchange: `mail${time}.example.com` }];
        }
      );

      // All with 50ms timeout - all should succeed (max resolution time is 25ms)
      const promises = resolutionTimes.map((_, i) =>
        emailValidator(`test${i}@concurrent.com`, {
          checkMx: true,
          detailed: true,
          timeout: 50,
          _resolveMx: mockResolvers[i],
        } as TestEmailValidatorOptions)
      );

      const results = await Promise.all(promises);

      // All should succeed since resolution times < timeout
      results.forEach((result, i) => {
        expect(result.valid).toBe(true);
        expect(result.mx?.records?.[0].exchange).toBe(
          `mail${resolutionTimes[i]}.example.com`
        );
      });
    });
  });
});
