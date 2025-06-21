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
  });
});
