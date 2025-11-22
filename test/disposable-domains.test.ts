import { disposableDomains } from '../src/disposable-domains.js';
import { isDisposableDomain } from '../src/disposable-checker.js';

describe('Disposable Domains Module', () => {
  describe('isDisposableDomain function', () => {
    test('should return true for known disposable domains', async () => {
      expect(await isDisposableDomain('10minutemail.com')).toBe(true);
      expect(await isDisposableDomain('guerrillamail.com')).toBe(true);
      expect(await isDisposableDomain('yopmail.com')).toBe(true);
      expect(await isDisposableDomain('tempmail.org')).toBe(true);
    });

    test('should return false for non-disposable domains', async () => {
      expect(await isDisposableDomain('gmail.com')).toBe(false);
      expect(await isDisposableDomain('yahoo.com')).toBe(false);
      expect(await isDisposableDomain('outlook.com')).toBe(false);
      expect(await isDisposableDomain('company.com')).toBe(false);
    });

    test('should handle case-insensitive domain checks', async () => {
      expect(await isDisposableDomain('10MinuteMail.COM')).toBe(true);
      expect(await isDisposableDomain('GUERRILLAMAIL.COM')).toBe(true);
      expect(await isDisposableDomain('YoPmAiL.cOm')).toBe(true);
    });

    test('should handle domains with different TLDs', async () => {
      expect(await isDisposableDomain('10minutemail.net')).toBe(true);
      expect(await isDisposableDomain('10minutemail.org')).toBe(true);
      expect(await isDisposableDomain('guerrillamail.biz')).toBe(true);
      expect(await isDisposableDomain('yopmail.fr')).toBe(true);
    });

    test('should return false for empty or invalid inputs', async () => {
      expect(await isDisposableDomain('')).toBe(false);
      expect(await isDisposableDomain(' ')).toBe(false);
      expect(await isDisposableDomain('not-a-domain')).toBe(false);
    });

    test('should handle edge cases', async () => {
      expect(await isDisposableDomain('10minutemail')).toBe(false); // Missing TLD
      expect(await isDisposableDomain('.com')).toBe(false);
    });

    describe('subdomain handling', () => {
      test('should return false for subdomains of disposable domains', async () => {
        // Single level subdomains
        expect(await isDisposableDomain('mail.10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('user.guerrillamail.com')).toBe(false);
        expect(await isDisposableDomain('smtp.yopmail.com')).toBe(false);
        expect(await isDisposableDomain('api.tempmail.org')).toBe(false);

        // Multi-level subdomains
        expect(await isDisposableDomain('sub.mail.10minutemail.com')).toBe(
          false
        );
        expect(await isDisposableDomain('a.b.c.guerrillamail.com')).toBe(false);
      });

      test('should handle www prefix correctly', async () => {
        // www.mailinator.com is in the list, so it should be disposable
        expect(await isDisposableDomain('www.mailinator.com')).toBe(true);
        // But www prefix for others should return false
        expect(await isDisposableDomain('www.10minutemail.com')).toBe(false);
      });
    });

    describe('unicode and internationalized domains', () => {
      test('should handle unicode domains correctly', async () => {
        // Punycode representation
        expect(await isDisposableDomain('xn--e1afmkfd.xn--p1ai')).toBe(false);
        // Unicode characters
        expect(await isDisposableDomain('пример.рф')).toBe(false);
        expect(await isDisposableDomain('测试.中国')).toBe(false);
        expect(await isDisposableDomain('café.com')).toBe(false);
      });

      test('should handle domains with special characters', async () => {
        expect(await isDisposableDomain('test@domain.com')).toBe(false);
        expect(await isDisposableDomain('test domain.com')).toBe(false);
        expect(await isDisposableDomain('test_domain.com')).toBe(false);
        expect(await isDisposableDomain('test-domain.com')).toBe(false);
      });
    });

    describe('edge cases for case sensitivity', () => {
      test('should handle mixed case with numbers and special chars', async () => {
        expect(await isDisposableDomain('10MinuteMail.COM')).toBe(true);
        expect(await isDisposableDomain('GUERRILLA-MAIL.COM')).toBe(false); // hyphen not in original
        expect(await isDisposableDomain('YoPmAiL.Fr')).toBe(true);
        expect(await isDisposableDomain('Temp-Mail.ORG')).toBe(true);
      });

      test('should handle all uppercase domains', async () => {
        expect(await isDisposableDomain('10MINUTEMAIL.COM')).toBe(true);
        expect(await isDisposableDomain('GUERRILLAMAIL.COM')).toBe(true);
        expect(await isDisposableDomain('YOPMAIL.COM')).toBe(true);
        expect(await isDisposableDomain('TEMPMAIL.ORG')).toBe(true);
      });
    });

    describe('malformed input handling', () => {
      test('should handle null and undefined gracefully', async () => {
        expect(await isDisposableDomain(null as any)).toBe(false);
        expect(await isDisposableDomain(undefined as any)).toBe(false);
      });

      test('should handle non-string inputs', async () => {
        expect(await isDisposableDomain(123 as any)).toBe(false);
        expect(await isDisposableDomain({} as any)).toBe(false);
        expect(await isDisposableDomain([] as any)).toBe(false);
        expect(await isDisposableDomain(true as any)).toBe(false);
      });

      test('should handle extremely long domains', async () => {
        const longDomain = `${'a'.repeat(1000)}.com`;
        expect(await isDisposableDomain(longDomain)).toBe(false);
      });

      test('should handle domains with multiple dots', async () => {
        expect(await isDisposableDomain('test..com')).toBe(false);
        expect(await isDisposableDomain('...com')).toBe(false);
        expect(await isDisposableDomain('test.')).toBe(false);
        expect(await isDisposableDomain('.test')).toBe(false);
      });
    });
  });

  describe('disposableDomains Set', () => {
    test('should contain no duplicate domains', () => {
      const domainArray = Array.from(disposableDomains);
      const uniqueDomains = new Set(domainArray);
      expect(domainArray.length).toBe(uniqueDomains.size);
    });

    test('should contain only lowercase domains', () => {
      const allLowercase = Array.from(disposableDomains).every(
        (domain) => domain === domain.toLowerCase()
      );
      expect(allLowercase).toBe(true);
    });

    test('should contain valid domain formats', () => {
      const validDomainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
      const allValid = Array.from(disposableDomains).every((domain) =>
        validDomainRegex.test(domain)
      );
      expect(allValid).toBe(true);
    });

    test('should have a reasonable number of domains', () => {
      // Ensure the list is not empty and has a reasonable size
      expect(disposableDomains.size).toBeGreaterThan(500);
      expect(disposableDomains.size).toBeLessThan(1000);

      // The actual count is validated above; ensure it remains within the expected range.
    });
  });

  // Performance and memory test constants
  const PERF_TEST_ITERATIONS = 1000;
  const EXPECTED_TRUE_COUNT = 500;
  const EXPECTED_FALSE_COUNT = 500;
  const PERF_WARMUP_ITERATIONS = 1000;
  const PERF_BATCH_COUNT = 5;
  const PERF_REPEATED_ITERATIONS = 100000;
  const LARGE_LOOKUP_COUNT = 10000;
  const DEFAULT_PERF_THRESHOLD_MS = 0.01;
  const DEFAULT_TOTAL_TIME_THRESHOLD_MS = 100;
  const MEMORY_TEST_ITERATIONS = 100000;
  const MAX_MEMORY_INCREASE_MB = 5;

  describe('performance', () => {
    test('should perform lookups efficiently', () => {
      const testDomains = [
        '10minutemail.com',
        'gmail.com',
        'guerrillamail.com',
        'yahoo.com',
        'yopmail.com',
        'outlook.com',
      ];

      const iterations = LARGE_LOOKUP_COUNT;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        testDomains.forEach((domain) => isDisposableDomain(domain));
      }

      const end = performance.now();
      const totalTime = end - start;
      const timePerOperation = totalTime / (iterations * testDomains.length);

      // Should be less than 0.2ms per operation (relaxed threshold)
      const relaxedThreshold = 0.2;
      expect(timePerOperation).toBeLessThan(relaxedThreshold);
    });

    test('should handle large number of concurrent checks', async () => {
      const domains = Array.from({ length: PERF_TEST_ITERATIONS }, (_, i) =>
        i % 2 === 0 ? '10minutemail.com' : `domain${i}.com`
      );

      const results = await Promise.all(
        domains.map((domain) => isDisposableDomain(domain))
      );

      expect(results.filter(Boolean).length).toBe(EXPECTED_TRUE_COUNT);
      expect(results.filter((r) => !r).length).toBe(EXPECTED_FALSE_COUNT);
    });

    test('should handle 10K+ concurrent lookups efficiently', async () => {
      const domains = Array.from({ length: LARGE_LOOKUP_COUNT }, (_, i) => {
        if (i % 3 === 0) return '10minutemail.com';
        if (i % 3 === 1) return 'guerrillamail.com';
        return `notdisposable${i}.com`;
      });

      const start = performance.now();
      const results = await Promise.all(
        domains.map((domain) => isDisposableDomain(domain))
      );
      const end = performance.now();

      const totalTime = end - start;
      const timePerOperation = totalTime / domains.length;

      // Performance expectations
      const performanceThreshold = parseFloat(
        process.env.PERFORMANCE_THRESHOLD_MS ||
          String(DEFAULT_PERF_THRESHOLD_MS)
      );
      const totalTimeThreshold = parseFloat(
        process.env.TOTAL_TIME_THRESHOLD_MS ||
          String(DEFAULT_TOTAL_TIME_THRESHOLD_MS)
      );
      expect(timePerOperation).toBeLessThan(performanceThreshold); // Configurable threshold
      expect(totalTime).toBeLessThan(totalTimeThreshold); // Configurable total time threshold

      // Verify correct results
      const disposableCount = results.filter(Boolean).length;
      expect(disposableCount).toBeGreaterThan(6000); // ~2/3 should be disposable
      expect(disposableCount).toBeLessThan(7000);
    });

    test('should maintain consistent performance with repeated lookups', () => {
      const domain = '10minutemail.com';
      const iterations = PERF_REPEATED_ITERATIONS;

      // Warm up
      for (let i = 0; i < PERF_WARMUP_ITERATIONS; i++) {
        isDisposableDomain(domain);
      }

      const timings: number[] = [];

      // Measure multiple batches
      for (let batch = 0; batch < PERF_BATCH_COUNT; batch++) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          isDisposableDomain(domain);
        }
        const end = performance.now();
        timings.push(end - start);
      }

      // Performance should be fast
      const avgTime = timings.reduce((a, b) => a + b) / timings.length;
      const avgTimePerOperation = avgTime / iterations;

      // Each operation should be very fast (less than 0.001ms)
      expect(avgTimePerOperation).toBeLessThan(0.001);

      // Total average time for 100K operations should be reasonable
      expect(avgTime).toBeLessThan(DEFAULT_TOTAL_TIME_THRESHOLD_MS);
    });
  });

  describe('memory usage', () => {
    const testFunction = typeof global.gc === 'function' ? test : test.skip;

    testFunction('should not leak memory during repeated operations', () => {
      const iterations = MEMORY_TEST_ITERATIONS;
      const domain = '10minutemail.com';

      // Force garbage collection and get baseline
      global.gc();
      const baselineMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < iterations; i++) {
        isDisposableDomain(domain);
        // Create some temporary strings to stress GC
        const tempDomain = `temp${i}.${domain}`;
        isDisposableDomain(tempDomain);
      }

      // Force garbage collection and check memory
      global.gc();
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - baselineMemory;

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(MAX_MEMORY_INCREASE_MB * 1024 * 1024);
    });
  });

  describe('additional edge cases', () => {
    describe('URL-encoded domains', () => {
      test('should handle URL-encoded domains', async () => {
        expect(await isDisposableDomain('10minutemail%2Ecom')).toBe(false);
        expect(await isDisposableDomain('guerrillamail%2Ecom')).toBe(false);
        expect(await isDisposableDomain('10minutemail%2ecom')).toBe(false);
        expect(await isDisposableDomain('yopmail%2Efr')).toBe(false);
      });
    });

    describe('whitespace handling', () => {
      test('should handle various whitespace characters', async () => {
        expect(await isDisposableDomain(' 10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('10minutemail.com ')).toBe(false);
        expect(await isDisposableDomain('  10minutemail.com  ')).toBe(false);
        expect(await isDisposableDomain('\t10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('10minutemail.com\n')).toBe(false);
        expect(await isDisposableDomain('\r\n10minutemail.com\r\n')).toBe(
          false
        );
      });

      test('should handle trimmed domains correctly', async () => {
        expect(await isDisposableDomain('10minutemail.com'.trim())).toBe(true);
        expect(await isDisposableDomain(' guerrillamail.com '.trim())).toBe(
          true
        );
      });
    });

    describe('domains with port numbers', () => {
      test('should return false for domains with port numbers', async () => {
        expect(await isDisposableDomain('10minutemail.com:8080')).toBe(false);
        expect(await isDisposableDomain('guerrillamail.com:443')).toBe(false);
        expect(await isDisposableDomain('yopmail.com:25')).toBe(false);
        expect(await isDisposableDomain('tempmail.org:3000')).toBe(false);
      });
    });

    describe('email addresses vs domains', () => {
      test('should return false for full email addresses', async () => {
        expect(await isDisposableDomain('user@10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('test@guerrillamail.com')).toBe(false);
        expect(await isDisposableDomain('admin@yopmail.com')).toBe(false);
        expect(await isDisposableDomain('john.doe+tag@tempmail.org')).toBe(
          false
        );
      });

      test('should handle email-like strings without @ symbol', async () => {
        expect(await isDisposableDomain('user.10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('test_guerrillamail.com')).toBe(false);
      });
    });

    describe('URLs and paths', () => {
      test('should return false for domains with query parameters', async () => {
        expect(await isDisposableDomain('10minutemail.com?param=value')).toBe(
          false
        );
        expect(
          await isDisposableDomain('guerrillamail.com?foo=bar&baz=qux')
        ).toBe(false);
        expect(await isDisposableDomain('yopmail.com?')).toBe(false);
      });

      test('should return false for domains with fragments', async () => {
        expect(await isDisposableDomain('10minutemail.com#section')).toBe(
          false
        );
        expect(await isDisposableDomain('yopmail.com#/inbox')).toBe(false);
        expect(await isDisposableDomain('tempmail.org#')).toBe(false);
      });

      test('should return false for domains with paths', async () => {
        expect(await isDisposableDomain('10minutemail.com/path')).toBe(false);
        expect(await isDisposableDomain('guerrillamail.com/inbox/user')).toBe(
          false
        );
        expect(await isDisposableDomain('yopmail.com/')).toBe(false);
      });

      test('should return false for URLs with protocols', async () => {
        expect(await isDisposableDomain('http://10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('https://guerrillamail.com')).toBe(
          false
        );
        expect(await isDisposableDomain('ftp://yopmail.com')).toBe(false);
        expect(await isDisposableDomain('mailto:test@tempmail.org')).toBe(
          false
        );
      });
    });

    describe('IP addresses and localhost', () => {
      test('should return false for IPv4 addresses', async () => {
        expect(await isDisposableDomain('192.168.1.1')).toBe(false);
        expect(await isDisposableDomain('127.0.0.1')).toBe(false);
        expect(await isDisposableDomain('8.8.8.8')).toBe(false);
        expect(await isDisposableDomain('255.255.255.255')).toBe(false);
      });

      test('should return false for IPv6 addresses', async () => {
        expect(await isDisposableDomain('[2001:db8::1]')).toBe(false);
        expect(await isDisposableDomain('2001:db8::1')).toBe(false);
        expect(await isDisposableDomain('::1')).toBe(false);
        expect(await isDisposableDomain('fe80::1')).toBe(false);
      });

      test('should return false for localhost variations', async () => {
        expect(await isDisposableDomain('localhost')).toBe(false);
        expect(await isDisposableDomain('localhost.localdomain')).toBe(false);
        expect(await isDisposableDomain('local.host')).toBe(false);
      });
    });

    describe('file paths', () => {
      test('should return false for file paths', async () => {
        expect(await isDisposableDomain('file:///path/to/file')).toBe(false);
        expect(await isDisposableDomain('C:\\Users\\test.com')).toBe(false);
        expect(await isDisposableDomain('/home/user/10minutemail.com')).toBe(
          false
        );
        expect(await isDisposableDomain('../10minutemail.com')).toBe(false);
        expect(await isDisposableDomain('./guerrillamail.com')).toBe(false);
      });
    });

    describe('mixed domain formats', () => {
      test('should handle domains with extra suffixes', async () => {
        expect(await isDisposableDomain('10minutemail.com.fake')).toBe(false);
        expect(await isDisposableDomain('prefix.10minutemail.com.suffix')).toBe(
          false
        );
        expect(await isDisposableDomain('10minutemail.com.com')).toBe(false);
      });

      test('should handle domains with numeric TLDs', async () => {
        expect(await isDisposableDomain('10minutemail.123')).toBe(false);
        expect(await isDisposableDomain('test.456')).toBe(false);
      });

      test('should handle domains with special characters in unexpected places', async () => {
        expect(await isDisposableDomain('10minutemail..com')).toBe(false);
        expect(await isDisposableDomain('10minutemail-.com')).toBe(false);
        expect(await isDisposableDomain('10minutemail_.com')).toBe(false);
      });
    });
  });
});
