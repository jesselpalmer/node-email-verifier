import {
  isDisposableDomain,
  disposableDomains,
} from '../src/disposable-domains.js';

describe('Disposable Domains Module', () => {
  describe('isDisposableDomain function', () => {
    test('should return true for known disposable domains', () => {
      expect(isDisposableDomain('10minutemail.com')).toBe(true);
      expect(isDisposableDomain('guerrillamail.com')).toBe(true);
      expect(isDisposableDomain('yopmail.com')).toBe(true);
      expect(isDisposableDomain('tempmail.org')).toBe(true);
    });

    test('should return false for non-disposable domains', () => {
      expect(isDisposableDomain('gmail.com')).toBe(false);
      expect(isDisposableDomain('yahoo.com')).toBe(false);
      expect(isDisposableDomain('outlook.com')).toBe(false);
      expect(isDisposableDomain('company.com')).toBe(false);
    });

    test('should handle case-insensitive domain checks', () => {
      expect(isDisposableDomain('10MinuteMail.COM')).toBe(true);
      expect(isDisposableDomain('GUERRILLAMAIL.COM')).toBe(true);
      expect(isDisposableDomain('YoPmAiL.cOm')).toBe(true);
    });

    test('should handle domains with different TLDs', () => {
      expect(isDisposableDomain('10minutemail.net')).toBe(true);
      expect(isDisposableDomain('10minutemail.org')).toBe(true);
      expect(isDisposableDomain('guerrillamail.biz')).toBe(true);
      expect(isDisposableDomain('yopmail.fr')).toBe(true);
    });

    test('should return false for empty or invalid inputs', () => {
      expect(isDisposableDomain('')).toBe(false);
      expect(isDisposableDomain(' ')).toBe(false);
      expect(isDisposableDomain('not-a-domain')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isDisposableDomain('10minutemail')).toBe(false); // Missing TLD
      expect(isDisposableDomain('.com')).toBe(false);
      expect(isDisposableDomain('mail.10minutemail.com')).toBe(false); // Subdomain
    });

    describe('subdomain handling', () => {
      test('should return false for subdomains of disposable domains', () => {
        // Single level subdomains
        expect(isDisposableDomain('mail.10minutemail.com')).toBe(false);
        expect(isDisposableDomain('user.guerrillamail.com')).toBe(false);
        expect(isDisposableDomain('smtp.yopmail.com')).toBe(false);
        expect(isDisposableDomain('api.tempmail.org')).toBe(false);

        // Multi-level subdomains
        expect(isDisposableDomain('sub.mail.10minutemail.com')).toBe(false);
        expect(isDisposableDomain('a.b.c.guerrillamail.com')).toBe(false);
      });

      test('should handle www prefix correctly', () => {
        // www.mailinator.com is in the list, so it should be disposable
        expect(isDisposableDomain('www.mailinator.com')).toBe(true);
        // But www prefix for others should return false
        expect(isDisposableDomain('www.10minutemail.com')).toBe(false);
      });
    });

    describe('unicode and internationalized domains', () => {
      test('should handle unicode domains correctly', () => {
        // Punycode representation
        expect(isDisposableDomain('xn--e1afmkfd.xn--p1ai')).toBe(false);
        // Unicode characters
        expect(isDisposableDomain('пример.рф')).toBe(false);
        expect(isDisposableDomain('测试.中国')).toBe(false);
        expect(isDisposableDomain('café.com')).toBe(false);
      });

      test('should handle domains with special characters', () => {
        expect(isDisposableDomain('test@domain.com')).toBe(false);
        expect(isDisposableDomain('test domain.com')).toBe(false);
        expect(isDisposableDomain('test_domain.com')).toBe(false);
        expect(isDisposableDomain('test-domain.com')).toBe(false);
      });
    });

    describe('edge cases for case sensitivity', () => {
      test('should handle mixed case with numbers and special chars', () => {
        expect(isDisposableDomain('10MinuteMail.COM')).toBe(true);
        expect(isDisposableDomain('GUERRILLA-MAIL.COM')).toBe(false); // hyphen not in original
        expect(isDisposableDomain('YoPmAiL.Fr')).toBe(true);
        expect(isDisposableDomain('Temp-Mail.ORG')).toBe(true);
      });

      test('should handle all uppercase domains', () => {
        expect(isDisposableDomain('10MINUTEMAIL.COM')).toBe(true);
        expect(isDisposableDomain('GUERRILLAMAIL.COM')).toBe(true);
        expect(isDisposableDomain('YOPMAIL.COM')).toBe(true);
        expect(isDisposableDomain('TEMPMAIL.ORG')).toBe(true);
      });
    });

    describe('malformed input handling', () => {
      test('should handle null and undefined gracefully', () => {
        expect(isDisposableDomain(null as any)).toBe(false);
        expect(isDisposableDomain(undefined as any)).toBe(false);
      });

      test('should handle non-string inputs', () => {
        expect(isDisposableDomain(123 as any)).toBe(false);
        expect(isDisposableDomain({} as any)).toBe(false);
        expect(isDisposableDomain([] as any)).toBe(false);
        expect(isDisposableDomain(true as any)).toBe(false);
      });

      test('should handle extremely long domains', () => {
        const longDomain = `${'a'.repeat(1000)}.com`;
        expect(isDisposableDomain(longDomain)).toBe(false);
      });

      test('should handle domains with multiple dots', () => {
        expect(isDisposableDomain('test..com')).toBe(false);
        expect(isDisposableDomain('...com')).toBe(false);
        expect(isDisposableDomain('test.')).toBe(false);
        expect(isDisposableDomain('.test')).toBe(false);
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

      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        testDomains.forEach((domain) => isDisposableDomain(domain));
      }

      const end = performance.now();
      const totalTime = end - start;
      const timePerOperation = totalTime / (iterations * testDomains.length);

      // Should be less than 0.2ms per operation (relaxed threshold)
      expect(timePerOperation).toBeLessThan(0.2);
    });

    test('should handle large number of concurrent checks', () => {
      const domains = Array.from({ length: 1000 }, (_, i) =>
        i % 2 === 0 ? '10minutemail.com' : `domain${i}.com`
      );

      const results = domains.map((domain) => isDisposableDomain(domain));

      expect(results.filter(Boolean).length).toBe(500);
      expect(results.filter((r) => !r).length).toBe(500);
    });

    test('should handle 10K+ concurrent lookups efficiently', () => {
      const domains = Array.from({ length: 10000 }, (_, i) => {
        if (i % 3 === 0) return '10minutemail.com';
        if (i % 3 === 1) return 'guerrillamail.com';
        return `notdisposable${i}.com`;
      });

      const start = performance.now();
      const results = domains.map((domain) => isDisposableDomain(domain));
      const end = performance.now();

      const totalTime = end - start;
      const timePerOperation = totalTime / domains.length;

      // Performance expectations
      expect(timePerOperation).toBeLessThan(0.01); // Less than 0.01ms per operation
      expect(totalTime).toBeLessThan(100); // Total time less than 100ms for 10K lookups

      // Verify correct results
      const disposableCount = results.filter(Boolean).length;
      expect(disposableCount).toBeGreaterThan(6000); // ~2/3 should be disposable
      expect(disposableCount).toBeLessThan(7000);
    });

    test('should maintain consistent performance with repeated lookups', () => {
      const domain = '10minutemail.com';
      const iterations = 100000;

      // Warm up
      for (let i = 0; i < 1000; i++) {
        isDisposableDomain(domain);
      }

      const timings: number[] = [];

      // Measure multiple batches
      for (let batch = 0; batch < 5; batch++) {
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
      expect(avgTime).toBeLessThan(100); // Less than 100ms for 100K operations
    });
  });

  describe('memory usage', () => {
    test('should not leak memory during repeated operations', () => {
      if (typeof global.gc !== 'function') {
        console.warn('Skipping memory test - run with --expose-gc flag');
        return;
      }

      const iterations = 100000;
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

      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });
});
