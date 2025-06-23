/**
 * MX Record Cache implementation for node-email-verifier
 * Provides TTL-based caching of MX records to improve performance
 */

import { MxRecord } from './types.js';

// Default probability of running cleanup on each set operation (10%)
const CLEANUP_PROBABILITY = 0.1;

/**
 * Cache statistics for monitoring cache performance
 */
export interface CacheStatistics {
  /** Total number of cache hits */
  hits: number;
  /** Total number of cache misses */
  misses: number;
  /** Total number of entries currently in cache */
  size: number;
  /** Total number of entries evicted due to TTL expiry */
  evictions: number;
  /** Cache hit rate as a percentage (0-100) */
  hitRate: number;
}

/**
 * Cached MX record entry with metadata
 */
interface CacheEntry {
  /** The cached MX records */
  records: MxRecord[];
  /** Timestamp when the entry was cached */
  timestamp: number;
  /** TTL in milliseconds for this specific entry */
  ttl: number;
}

/**
 * Configuration options for MX cache
 */
export interface MxCacheOptions {
  /** Whether caching is enabled. Defaults to true */
  enabled?: boolean;
  /** Default TTL in milliseconds. Defaults to 300000 (5 minutes) */
  defaultTtl?: number;
  /** Maximum number of entries in cache. Defaults to 1000 */
  maxSize?: number;
  /** Whether to enable periodic cleanup of expired entries. Defaults to true. Set to false for deterministic behavior in tests */
  cleanupEnabled?: boolean;
  /** Probability of running cleanup on each set operation (0-1). Defaults to 0.1 (10%) */
  cleanupProbability?: number;
}

/**
 * MX Record Cache with TTL support and statistics
 */
export class MxCache {
  private cache: Map<string, CacheEntry>;
  private statistics: Omit<CacheStatistics, 'hitRate'>;
  private readonly options: Required<MxCacheOptions>;

  constructor(options: MxCacheOptions = {}) {
    this.cache = new Map();
    this.statistics = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };
    this.options = {
      enabled: options.enabled !== false,
      defaultTtl: options.defaultTtl || 300000, // 5 minutes
      maxSize: options.maxSize || 1000,
      cleanupEnabled: options.cleanupEnabled !== false, // Default true
      cleanupProbability: options.cleanupProbability ?? CLEANUP_PROBABILITY, // Default 0.1
    };
  }

  /**
   * Get MX records from cache if available and not expired
   * @param domain - The domain to look up
   * @returns Cached MX records or null if not found/expired
   */
  get(domain: string): MxRecord[] | null {
    if (!this.options.enabled) {
      return null;
    }

    const key = domain.toLowerCase();
    const entry = this.cache.get(key);

    if (!entry) {
      this.statistics.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      this.statistics.size--;
      this.statistics.evictions++;
      this.statistics.misses++;
      return null;
    }

    // LRU: Move to end (most recently used) by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.statistics.hits++;
    return entry.records;
  }

  /**
   * Store MX records in cache
   * @param domain - The domain to cache
   * @param records - The MX records to cache
   * @param ttl - Optional TTL in milliseconds (uses default if not provided)
   */
  set(domain: string, records: MxRecord[], ttl?: number): void {
    if (!this.options.enabled) {
      return;
    }

    const key = domain.toLowerCase();

    // Check cache size limit
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      // LRU eviction: Remove least recently used entry (first in Map)
      // The Map maintains insertion order, and we move accessed items to the end,
      // so the first item is the least recently used.
      const lruKey = this.cache.keys().next().value;
      if (lruKey) {
        this.cache.delete(lruKey);
        this.statistics.size--;
        this.statistics.evictions++;
      }
    }

    // Add periodic cleanup of expired entries to prevent memory accumulation
    // Can be disabled for deterministic behavior in tests
    if (
      this.options.cleanupEnabled &&
      this.cache.size > 0 &&
      Math.random() < this.options.cleanupProbability
    ) {
      // Run cleanup based on configured probability
      this.cleanExpired();
    }

    const wasUpdate = this.cache.has(key);

    this.cache.set(key, {
      records,
      timestamp: Date.now(),
      ttl: ttl !== undefined ? ttl : this.options.defaultTtl,
    });

    if (!wasUpdate) {
      this.statistics.size++;
    }
  }

  /**
   * Clear all entries from the cache
   */
  flush(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    this.statistics.size = 0;
    this.statistics.evictions += previousSize;
  }

  /**
   * Clear specific domain from cache
   * @param domain - The domain to remove from cache
   * @returns true if entry was removed, false if not found
   */
  delete(domain: string): boolean {
    const deleted = this.cache.delete(domain.toLowerCase());
    if (deleted) {
      this.statistics.size--;
      this.statistics.evictions++;
    }
    return deleted;
  }

  /**
   * Get current cache statistics
   * @returns Cache statistics including hit rate
   */
  getStatistics(): CacheStatistics {
    const total = this.statistics.hits + this.statistics.misses;
    const hitRate = total > 0 ? (this.statistics.hits / total) * 100 : 0;

    return {
      ...this.statistics,
      hitRate: parseFloat(hitRate.toFixed(2)), // Round to 2 decimal places
    };
  }

  /**
   * Reset cache statistics (does not clear cache entries)
   */
  resetStatistics(): void {
    this.statistics.hits = 0;
    this.statistics.misses = 0;
    this.statistics.evictions = 0;
    // Note: size is not reset as it reflects actual cache content
  }

  /**
   * Check if caching is enabled
   * @returns true if cache is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Clean up expired entries from cache
   * This is called automatically on get() but can be called manually
   * @returns Number of entries removed
   */
  cleanExpired(): number {
    if (!this.options.enabled) {
      return 0;
    }

    const now = Date.now();
    const expiredKeys: string[] = [];

    // Collect expired keys first to avoid iteration issues
    for (const [domain, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(domain);
      }
    }

    // Delete expired entries
    for (const domain of expiredKeys) {
      this.cache.delete(domain);
      this.statistics.size--;
      this.statistics.evictions++;
    }

    return expiredKeys.length;
  }
}

// Global cache instance
export const globalMxCache = new MxCache();
