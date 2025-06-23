/**
 * MX Record Cache implementation for node-email-verifier
 * Provides TTL-based caching of MX records to improve performance
 */

import { MxRecord } from './types.js';

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

    const entry = this.cache.get(domain.toLowerCase());

    if (!entry) {
      this.statistics.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(domain.toLowerCase());
      this.statistics.size--;
      this.statistics.evictions++;
      this.statistics.misses++;
      return null;
    }

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

    // Check cache size limit
    if (
      this.cache.size >= this.options.maxSize &&
      !this.cache.has(domain.toLowerCase())
    ) {
      // Evict oldest entry (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.statistics.size--;
        this.statistics.evictions++;
      }
    }

    const wasUpdate = this.cache.has(domain.toLowerCase());

    this.cache.set(domain.toLowerCase(), {
      records,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTtl,
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
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
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
    let removed = 0;

    for (const [domain, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(domain);
        this.statistics.size--;
        this.statistics.evictions++;
        removed++;
      }
    }

    return removed;
  }
}

// Global cache instance
export const globalMxCache = new MxCache();
