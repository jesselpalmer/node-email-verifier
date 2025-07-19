import { jest } from '@jest/globals';

describe('Lazy Loading', () => {
  let isDisposableDomain: any;
  let preloadDisposableDomains: any;
  let areDisposableDomainsLoaded: any;

  beforeEach(async () => {
    // Clear module cache to ensure fresh state
    jest.resetModules();

    // Re-import modules to get fresh instances
    const module = await import('../src/disposable-checker');
    isDisposableDomain = module.isDisposableDomain;
    preloadDisposableDomains = module.preloadDisposableDomains;
    areDisposableDomainsLoaded = module.areDisposableDomainsLoaded;
  });

  describe('disposable domains lazy loading', () => {
    it('should not load domains until first check', () => {
      expect(areDisposableDomainsLoaded()).toBe(false);
    });

    it('should load domains on first check', async () => {
      expect(areDisposableDomainsLoaded()).toBe(false);

      const result = await isDisposableDomain('10minutemail.com');

      expect(result).toBe(true);
      expect(areDisposableDomainsLoaded()).toBe(true);
    });

    it('should handle concurrent loading correctly', async () => {
      expect(areDisposableDomainsLoaded()).toBe(false);

      // Start multiple checks simultaneously
      const promises = [
        isDisposableDomain('10minutemail.com'),
        isDisposableDomain('guerrillamail.com'),
        isDisposableDomain('example.com'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBe(true); // 10minutemail.com is disposable
      expect(results[1]).toBe(true); // guerrillamail.com is disposable
      expect(results[2]).toBe(false); // example.com is not disposable
      expect(areDisposableDomainsLoaded()).toBe(true);
    });

    it('should handle preloading correctly', async () => {
      expect(areDisposableDomainsLoaded()).toBe(false);

      await preloadDisposableDomains();

      expect(areDisposableDomainsLoaded()).toBe(true);

      // Subsequent checks should be fast
      const result = await isDisposableDomain('tempmail.org');
      expect(result).toBe(true);
    });

    it('should handle invalid inputs gracefully', async () => {
      expect(await isDisposableDomain('')).toBe(false);
      expect(await isDisposableDomain(null as any)).toBe(false);
      expect(await isDisposableDomain(undefined as any)).toBe(false);
      expect(await isDisposableDomain(123 as any)).toBe(false);
    });

    it('should be case insensitive', async () => {
      expect(await isDisposableDomain('10MINUTEMAIL.COM')).toBe(true);
      expect(await isDisposableDomain('10MinuteMail.com')).toBe(true);
      expect(await isDisposableDomain('10minutemail.COM')).toBe(true);
    });
  });
});
