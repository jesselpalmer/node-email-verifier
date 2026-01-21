/**
 * Disposable email domain checker with lazy loading support
 * This module reduces initial bundle size by deferring the loading
 * of the large disposable domains list until it's actually needed.
 */

let disposableDomainsSet: Set<string> | null = null;
let loadingPromise: Promise<Set<string>> | null = null;

/**
 * Lazily loads the disposable domains set using dynamic import
 * @returns Promise resolving to the Set of disposable domains
 */
async function loadDisposableDomains(): Promise<Set<string>> {
  if (disposableDomainsSet !== null) {
    return disposableDomainsSet;
  }

  if (loadingPromise !== null) {
    return loadingPromise;
  }

  loadingPromise = import('./disposable-domains.js')
    .then((module) => {
      disposableDomainsSet = module.disposableDomains;
      return disposableDomainsSet;
    })
    .catch((error) => {
      loadingPromise = null;
      throw new Error(`Failed to load disposable domains: ${error.message}`);
    });

  return loadingPromise;
}

/**
 * Checks if an email domain is from a known disposable email provider
 * Uses lazy loading to defer loading the domains list until first use
 * @param domain - The domain to check
 * @returns Promise resolving to true if the domain is disposable, false otherwise
 */
export async function isDisposableDomain(domain: string): Promise<boolean> {
  // Handle invalid inputs gracefully
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  const disposableDomains = await loadDisposableDomains();
  return disposableDomains.has(domain.toLowerCase());
}

/**
 * Preloads the disposable domains for performance-critical paths
 * Call this during app initialization to avoid lazy loading delay
 * @returns Promise that resolves when domains are loaded
 */
export async function preloadDisposableDomains(): Promise<void> {
  await loadDisposableDomains();
}

/**
 * Checks if disposable domains have been loaded
 * Useful for debugging and testing
 * @returns true if domains are loaded, false otherwise
 */
export function areDisposableDomainsLoaded(): boolean {
  return disposableDomainsSet !== null;
}
