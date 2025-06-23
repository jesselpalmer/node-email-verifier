import { ErrorCode } from '../src/errors.js';
import emailValidator from '../src/index.js';
import type { MxRecord } from 'dns';
import type { ValidationResult } from '../src/index.js';
import {
  setupCacheIsolation,
  TestEmailValidatorOptions,
} from './test-helpers.js';

// Type for DNS errors
interface DnsError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  hostname?: string;
}

describe('Transient DNS Failure Tests', () => {
  beforeEach(() => {
    setupCacheIsolation();
  });
  describe('Retry logic for transient failures', () => {
    test('should handle transient SERVFAIL errors consistently', async () => {
      let callCount = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        callCount++;

        // Simulate transient DNS server failure
        const error = new Error('queryMx ESERVFAIL transient.com') as DnsError;
        error.code = 'ESERVFAIL';
        error.errno = -4040;
        error.syscall = 'queryMx';
        error.hostname = 'transient.com';
        throw error;
      };

      const result = await emailValidator('test@transient.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as TestEmailValidatorOptions);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
      expect(callCount).toBe(1); // Current implementation doesn't retry
    });

    test('should handle intermittent network connectivity issues', async () => {
      let attemptCount = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        attemptCount++;

        // Simulate consistent connectivity issues for current implementation
        const error = new Error('getaddrinfo EAI_AGAIN') as DnsError;
        error.code = 'EAI_AGAIN';
        error.errno = -3001;
        error.syscall = 'getaddrinfo';
        throw error;
      };

      // Test multiple validations to see consistent behavior
      const emails = [
        'test1@intermittent.com',
        'test2@intermittent.com',
        'test3@intermittent.com',
      ];

      const results = [];
      for (const email of emails) {
        const result = await emailValidator(email, {
          checkMx: true,
          detailed: true,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        results.push(result);
      }

      // Current implementation doesn't retry, so all should fail
      results.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(false);
        // EAI_AGAIN with getaddrinfo syscall is treated as DNS lookup failure
        expect((result as ValidationResult).mx?.errorCode).toBe(
          ErrorCode.DNS_LOOKUP_FAILED
        );
      });

      expect(attemptCount).toBe(3); // One attempt per email
    });

    test('should handle DNS server rotation failures', async () => {
      let serverIndex = 0;
      const servers = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        const currentServer = servers[serverIndex % servers.length];
        serverIndex++;

        // Simulate different servers having different issues
        if (currentServer === '8.8.8.8') {
          const error = new Error(
            'connect ECONNREFUSED 8.8.8.8:53'
          ) as DnsError;
          error.code = 'ECONNREFUSED';
          error.address = '8.8.8.8';
          error.port = 53;
          throw error;
        } else if (currentServer === '8.8.4.4') {
          const error = new Error('queryMx ETIMEOUT') as DnsError;
          error.code = 'ETIMEOUT';
          throw error;
        } else {
          // 1.1.1.1 works
          return [{ priority: 10, exchange: 'mail.rotation.com' }];
        }
      };

      const result = await emailValidator('test@rotation.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as TestEmailValidatorOptions);

      // Current implementation would fail on first server
      expect(result.valid).toBe(false);
      expect(result.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should handle temporary DNS cache poisoning', async () => {
      let lookupCount = 0;
      const mockResolveMx = async (hostname: string): Promise<MxRecord[]> => {
        lookupCount++;

        // Simulate cached poisoned response for first few lookups
        if (lookupCount <= 3) {
          const error = new Error(`queryMx ENOTFOUND ${hostname}`) as DnsError;
          error.code = 'ENOTFOUND';
          error.hostname = hostname;
          throw error;
        }

        // After cache expiry, return correct result
        return [{ priority: 10, exchange: `mail.${hostname}` }];
      };

      const results = [];
      for (let i = 0; i < 5; i++) {
        // Use different domains to avoid cache hits
        const result = await emailValidator(`test@poisoned-${i}.com`, {
          checkMx: true,
          detailed: true,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        results.push(result);
      }

      // First 3 should fail due to poisoned cache
      results.slice(0, 3).forEach((result) => {
        expect((result as ValidationResult).valid).toBe(false);
        expect((result as ValidationResult).mx?.errorCode).toBe(
          ErrorCode.DNS_LOOKUP_FAILED
        );
      });

      // Last 2 should succeed after cache expiry
      results.slice(3).forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
        expect((result as ValidationResult).mx?.records).toHaveLength(1);
      });

      expect(lookupCount).toBe(5);
    });

    test('should handle DNS load balancer failover', async () => {
      let requestCount = 0;
      const loadBalancers = ['primary', 'secondary', 'tertiary'];

      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        const currentLb = loadBalancers[requestCount % loadBalancers.length];
        requestCount++;

        switch (currentLb) {
          case 'primary': {
            // Primary is overloaded
            const error = new Error('queryMx ECONNRESET') as DnsError;
            error.code = 'ECONNRESET';
            throw error;
          }

          case 'secondary':
            // Secondary is slow but works
            await new Promise((resolve) => setTimeout(resolve, 50));
            return [{ priority: 10, exchange: 'mail-secondary.example.com' }];

          case 'tertiary':
            // Tertiary is fast
            return [{ priority: 5, exchange: 'mail-tertiary.example.com' }];

          default:
            throw new Error('Unknown load balancer');
        }
      };

      const emails = ['test1@lb-1.com', 'test2@lb-2.com', 'test3@lb-3.com'];
      const results = [];

      for (const email of emails) {
        const result = await emailValidator(email, {
          checkMx: true,
          detailed: true,
          timeout: 100,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        results.push(result);
      }

      // First request fails (primary overloaded)
      expect((results[0] as ValidationResult).valid).toBe(false);
      expect((results[0] as ValidationResult).mx?.errorCode).toBe(
        ErrorCode.MX_LOOKUP_FAILED
      );

      // Second succeeds (secondary works)
      expect((results[1] as ValidationResult).valid).toBe(true);
      expect((results[1] as ValidationResult).mx?.records?.[0].exchange).toBe(
        'mail-secondary.example.com'
      );

      // Third succeeds (tertiary works)
      expect((results[2] as ValidationResult).valid).toBe(true);
      expect((results[2] as ValidationResult).mx?.records?.[0].exchange).toBe(
        'mail-tertiary.example.com'
      );

      expect(requestCount).toBe(3);
    });
  });

  describe('Network instability scenarios', () => {
    test('should handle packet loss simulation', async () => {
      let callCount = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        callCount++;
        // Simulate deterministic packet loss - fail on every 3rd call
        if (callCount % 3 === 0) {
          const error = new Error('queryMx timeout') as DnsError;
          error.code = 'ETIMEOUT';
          throw error;
        }

        return [{ priority: 10, exchange: 'mail.packetloss.com' }];
      };

      // Run multiple validations to test packet loss handling
      const attempts = 9; // 9 attempts = 6 successes, 3 failures
      const results = [];

      for (let i = 0; i < attempts; i++) {
        const result = await emailValidator(`packet@test-${i}.com`, {
          checkMx: true,
          detailed: true,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        results.push(result);
      }

      // Should have mix of successes and failures
      const successes = results.filter((r) => (r as ValidationResult).valid);
      const failures = results.filter((r) => !(r as ValidationResult).valid);

      expect(successes.length).toBe(6); // Calls 1,2,4,5,7,8
      expect(failures.length).toBe(3); // Calls 3,6,9
      expect(successes.length + failures.length).toBe(attempts);

      // All failures should be DNS lookup failures
      failures.forEach((result) => {
        expect((result as ValidationResult).mx?.errorCode).toBe(
          ErrorCode.MX_LOOKUP_FAILED
        );
      });
    });

    test('should handle jittery network conditions', async () => {
      let callCount = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        callCount++;
        // Deterministic jittery response times based on call count
        // Pattern: 10ms, 50ms, 100ms, 150ms, 190ms (fails), repeat
        const responseTimes = [10, 50, 100, 150, 190];
        const responseTime = responseTimes[callCount % responseTimes.length];
        await new Promise((resolve) => setTimeout(resolve, responseTime));

        // Fail on response times > 180ms (every 5th call)
        if (responseTime > 180) {
          const error = new Error('Network jitter timeout') as DnsError;
          error.code = 'ETIMEOUT';
          throw error;
        }

        return [{ priority: 10, exchange: 'mail.jittery.com' }];
      };

      const results = [];
      for (let i = 0; i < 10; i++) {
        try {
          const result = await emailValidator(`jitter@test-${i}.com`, {
            checkMx: true,
            detailed: true,
            timeout: 250, // Increased timeout to reduce DNS_LOOKUP_TIMEOUT
            _resolveMx: mockResolveMx,
          } as TestEmailValidatorOptions);
          results.push(result);
        } catch {
          // Handle timeout errors
          results.push({
            valid: false,
            mx: { errorCode: ErrorCode.DNS_LOOKUP_TIMEOUT },
          });
        }
      }

      // Should have mostly successes with some failures (8 successes, 2 failures)
      const successes = results.filter((r) => (r as ValidationResult).valid);
      const failures = results.filter((r) => !(r as ValidationResult).valid);

      expect(successes.length).toBe(8); // Calls 1,2,3,4,6,7,8,9
      expect(failures.length).toBe(2); // Calls 5,10 (190ms responses)

      // Check that failures are properly categorized
      failures.forEach((result) => {
        const errorCode = (result as ValidationResult).mx?.errorCode;
        expect([
          ErrorCode.MX_LOOKUP_FAILED,
          ErrorCode.DNS_LOOKUP_TIMEOUT,
        ]).toContain(errorCode);
      });
    }, 20000);

    test('should handle DNS amplification attack mitigation', async () => {
      let queryCount = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        queryCount++;

        // Simulate DNS server rate limiting after 5 queries
        if (queryCount > 5) {
          const error = new Error('Rate limited: too many queries') as DnsError;
          error.code = 'ESERVFAIL';
          throw error;
        }

        return [{ priority: 10, exchange: 'mail.ratelimited.com' }];
      };

      const emails = Array.from(
        { length: 10 },
        (_, i) => `test@ratelimited-${i}.com`
      );

      const results = [];
      for (const email of emails) {
        const result = await emailValidator(email, {
          checkMx: true,
          detailed: true,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        results.push(result);
      }

      // First 5 should succeed
      results.slice(0, 5).forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
      });

      // Remaining should fail due to rate limiting
      results.slice(5).forEach((result) => {
        expect((result as ValidationResult).valid).toBe(false);
        expect((result as ValidationResult).mx?.errorCode).toBe(
          ErrorCode.MX_LOOKUP_FAILED
        );
      });

      expect(queryCount).toBe(10);
    });
  });

  describe('Recovery patterns', () => {
    test('should demonstrate graceful degradation under DNS stress', async () => {
      let stressLevel = 0;
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        stressLevel++;

        // Progressively degrade service quality
        if (stressLevel <= 5) {
          // Normal operation
          return [{ priority: 10, exchange: 'mail.normal.com' }];
        } else if (stressLevel <= 10) {
          // Slower responses
          await new Promise((resolve) => setTimeout(resolve, 100));
          return [{ priority: 10, exchange: 'mail.slow.com' }];
        } else if (stressLevel <= 15) {
          // Some failures
          if (stressLevel % 2 === 0) {
            const error = new Error('Intermittent failure') as DnsError;
            error.code = 'ESERVFAIL';
            throw error;
          }
          return [{ priority: 10, exchange: 'mail.intermittent.com' }];
        } else {
          // Complete failure
          const error = new Error('DNS overloaded') as DnsError;
          error.code = 'ESERVFAIL';
          throw error;
        }
      };

      const results = [];
      for (let i = 0; i < 20; i++) {
        const result = await emailValidator(`stress@test-${i}.com`, {
          checkMx: true,
          detailed: true,
          timeout: 200,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        results.push(result);
      }

      // Should show degradation pattern
      const phase1 = results.slice(0, 5);
      const phase2 = results.slice(5, 10);
      const phase3 = results.slice(10, 15);
      const phase4 = results.slice(15, 20);

      // Phase 1: All should succeed quickly
      phase1.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
      });

      // Phase 2: All should succeed but slower
      phase2.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
      });

      // Phase 3: Mix of success and failure
      const phase3Success = phase3.filter((r) => (r as ValidationResult).valid);
      const phase3Failure = phase3.filter(
        (r) => !(r as ValidationResult).valid
      );
      expect(phase3Success.length).toBeGreaterThan(0);
      expect(phase3Failure.length).toBeGreaterThan(0);

      // Phase 4: All should fail
      phase4.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(false);
        expect((result as ValidationResult).mx?.errorCode).toBe(
          ErrorCode.MX_LOOKUP_FAILED
        );
      });
    });

    test('should handle DNS cache warming scenarios', async () => {
      const cacheMap = new Map<string, MxRecord[]>();

      const mockResolveMx = async (hostname: string): Promise<MxRecord[]> => {
        // Simulate cache lookup
        if (cacheMap.has(hostname)) {
          // Cache hit - return immediately
          return cacheMap.get(hostname)!;
        }

        // Cache miss - simulate slow lookup
        await new Promise((resolve) => setTimeout(resolve, 100));

        const records = [{ priority: 10, exchange: `mail.${hostname}` }];
        cacheMap.set(hostname, records);
        return records;
      };

      const domain = 'cached.com';
      const emails = Array.from({ length: 5 }, (_, i) => `test${i}@${domain}`);

      const results = [];
      const timings = [];

      for (const email of emails) {
        const startTime = Date.now();
        const result = await emailValidator(email, {
          checkMx: true,
          detailed: true,
          _resolveMx: mockResolveMx,
        } as TestEmailValidatorOptions);
        const endTime = Date.now();

        results.push(result);
        timings.push(endTime - startTime);
      }

      // All should succeed
      results.forEach((result) => {
        expect((result as ValidationResult).valid).toBe(true);
      });

      // First lookup should be slow (cache miss)
      expect(timings[0]).toBeGreaterThan(90);

      // Subsequent lookups should be fast (cache hits)
      timings.slice(1).forEach((timing) => {
        expect(timing).toBeLessThan(50);
      });
    });
  });
});
