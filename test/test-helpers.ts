import { globalMxCache } from '../src/index.js';
import type { EmailValidatorOptions } from '../src/index.js';
import type { MxRecord } from '../src/types.js';

/**
 * Clears the global MX cache and resets statistics.
 * Use this in beforeEach hooks to ensure test isolation.
 */
export function clearGlobalMxCache(): void {
  globalMxCache.flush();
  globalMxCache.resetStatistics();
}

/**
 * Setup function for tests that need cache isolation.
 * Call this in beforeEach hooks to ensure clean cache state.
 * This is a convenience wrapper around clearGlobalMxCache.
 */
export function setupCacheIsolation(): void {
  clearGlobalMxCache();
}

/**
 * Extended email validator options for testing that includes internal methods.
 * This interface allows us to inject mock DNS resolvers for testing.
 */
export interface TestEmailValidatorOptions extends EmailValidatorOptions {
  _resolveMx?: (hostname: string) => Promise<MxRecord[]>;
}

/**
 * Creates test email validator options with the given properties.
 * This helper reduces repetitive casting to TestEmailValidatorOptions.
 */
export function createTestOptions(
  options: TestEmailValidatorOptions
): TestEmailValidatorOptions {
  return options;
}
