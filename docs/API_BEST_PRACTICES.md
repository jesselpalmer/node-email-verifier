# API Best Practices

This document covers best practices for using the node-email-verifier library in production
environments.

## Rate Limiting Considerations for MX Checks

When performing MX record lookups at scale, it's important to understand the rate limiting
implications.

### DNS Rate Limiting Overview

DNS queries, including MX record lookups, can be subject to rate limiting at multiple levels:

1. **DNS Resolver Limits** - Your DNS resolver (ISP, Google DNS, Cloudflare, etc.) may limit queries
2. **Authoritative DNS Server Limits** - The target domain's DNS servers may have rate limits
3. **Local System Limits** - Operating system DNS resolution may have built-in throttling

### Potential Issues

High-volume MX record checks can lead to:

- DNS query timeouts
- Temporary DNS resolution failures
- IP-based blocking from DNS servers
- Degraded performance for all DNS queries from your system

### Recommended Practices

#### 1. Implement Request Throttling

```javascript
import emailValidator from 'node-email-verifier';
import pLimit from 'p-limit';

// Limit concurrent MX lookups
const limit = pLimit(10); // Max 10 concurrent DNS queries

async function validateEmails(emails) {
  const promises = emails.map((email) => limit(() => emailValidator(email, { checkMx: true })));

  return Promise.all(promises);
}
```

#### 2. Add Retry Logic with Exponential Backoff

```javascript
async function validateWithRetry(email, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await emailValidator(email, {
        checkMx: true,
        timeout: 5000 * attempt, // Increase timeout with each retry
      });
    } catch (error) {
      lastError = error;

      // Only retry on DNS timeout errors
      if (error.code === 'DNS_LOOKUP_TIMEOUT' && attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
```

#### 3. Use Caching for MX Records

```javascript
const mxCache = new Map();
const MX_CACHE_TTL = 3600000; // 1 hour

async function getCachedMxValidation(email) {
  const domain = email.split('@')[1];
  const cached = mxCache.get(domain);

  if (cached && Date.now() - cached.timestamp < MX_CACHE_TTL) {
    return {
      valid: cached.valid,
      email,
      format: { valid: true },
      mx: cached.mx,
      fromCache: true,
    };
  }

  const result = await emailValidator(email, { checkMx: true });

  // Cache the domain's MX result
  mxCache.set(domain, {
    valid: result.mx.valid,
    mx: result.mx,
    timestamp: Date.now(),
  });

  return result;
}
```

#### 4. Batch Validations by Domain

```javascript
async function batchValidateByDomain(emails) {
  // Group emails by domain
  const emailsByDomain = emails.reduce((acc, email) => {
    const domain = email.split('@')[1];
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(email);
    return acc;
  }, {});

  const results = [];

  // Process one domain at a time
  for (const [domain, domainEmails] of Object.entries(emailsByDomain)) {
    // Check MX for first email only
    const firstEmail = domainEmails[0];
    const mxResult = await emailValidator(firstEmail, { checkMx: true });

    // Apply MX result to all emails from this domain
    for (const email of domainEmails) {
      if (email === firstEmail) {
        results.push(mxResult);
      } else {
        // Validate format only for remaining emails
        const formatResult = await emailValidator(email, { checkMx: false });
        results.push({
          ...formatResult,
          mx: mxResult.mx,
        });
      }
    }

    // Small delay between domains
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
```

### Monitoring and Alerts

Implement monitoring to detect rate limiting issues:

```javascript
let dnsTimeouts = 0;
let dnsErrors = 0;
const resetInterval = 60000; // Reset counters every minute

setInterval(() => {
  if (dnsTimeouts > 10 || dnsErrors > 20) {
    console.warn('High DNS failure rate detected', {
      timeouts: dnsTimeouts,
      errors: dnsErrors,
    });
  }
  dnsTimeouts = 0;
  dnsErrors = 0;
}, resetInterval);

async function monitoredValidation(email) {
  try {
    return await emailValidator(email, { checkMx: true });
  } catch (error) {
    if (error.code === 'DNS_LOOKUP_TIMEOUT') {
      dnsTimeouts++;
    } else if (error.code === 'DNS_LOOKUP_FAILED') {
      dnsErrors++;
    }
    throw error;
  }
}
```

### Alternative Approaches

For high-volume applications, consider:

1. **DNS Caching Proxy** - Run a local DNS caching server (e.g., dnsmasq, unbound)
2. **Multiple DNS Resolvers** - Rotate between different DNS servers
3. **Bulk Email Validation Services** - Use specialized services for large-scale validation
4. **Asynchronous Processing** - Queue validations and process them gradually

### Example: Production-Ready Implementation

```javascript
import emailValidator from 'node-email-verifier';
import pLimit from 'p-limit';

class EmailValidationService {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;
    this.retryAttempts = options.retryAttempts || 3;
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour
    this.requestDelay = options.requestDelay || 100; // ms between requests

    this.limit = pLimit(this.concurrency);
    this.cache = new Map();
    this.stats = {
      total: 0,
      cached: 0,
      errors: 0,
      timeouts: 0,
    };
  }

  async validate(email, options = {}) {
    this.stats.total++;

    // Check cache first if MX check is requested
    if (options.checkMx) {
      const cached = this.getCached(email);
      if (cached) {
        this.stats.cached++;
        return cached;
      }
    }

    // Rate-limited validation with retry
    return this.limit(async () => {
      const result = await this.validateWithRetry(email, options);

      // Add delay between requests
      if (this.requestDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.requestDelay));
      }

      return result;
    });
  }

  async validateWithRetry(email, options, attempt = 1) {
    try {
      const result = await emailValidator(email, {
        ...options,
        timeout: options.timeout || 5000 * attempt,
      });

      // Cache successful MX lookups
      if (options.checkMx && result.mx) {
        this.setCached(email, result);
      }

      return result;
    } catch (error) {
      if (error.code === 'DNS_LOOKUP_TIMEOUT') {
        this.stats.timeouts++;
      } else {
        this.stats.errors++;
      }

      // Retry on timeout if attempts remain
      if (error.code === 'DNS_LOOKUP_TIMEOUT' && attempt < this.retryAttempts) {
        const backoff = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.validateWithRetry(email, options, attempt + 1);
      }

      throw error;
    }
  }

  getCached(email) {
    const domain = email.split('@')[1];
    const cached = this.cache.get(domain);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return {
        ...cached.result,
        email, // Update email in cached result
        fromCache: true,
      };
    }

    return null;
  }

  setCached(email, result) {
    const domain = email.split('@')[1];
    this.cache.set(domain, {
      result: {
        valid: result.valid,
        format: result.format,
        mx: result.mx,
        disposable: result.disposable,
      },
      timestamp: Date.now(),
    });
  }

  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.cached / this.stats.total || 0,
      errorRate: this.stats.errors / this.stats.total || 0,
      timeoutRate: this.stats.timeouts / this.stats.total || 0,
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

// Usage
const validator = new EmailValidationService({
  concurrency: 10,
  retryAttempts: 3,
  requestDelay: 100,
});

// Validate with automatic rate limiting and caching
const result = await validator.validate('user@example.com', { checkMx: true });

// Get performance stats
console.log(validator.getStats());
```

## Summary

When using MX record checks in production:

1. **Always implement rate limiting** to avoid overwhelming DNS servers
2. **Cache results** to reduce redundant DNS queries
3. **Add retry logic** with exponential backoff for transient failures
4. **Monitor failure rates** to detect and respond to issues
5. **Consider alternatives** for very high-volume use cases

Remember that MX record validation adds significant overhead and potential points of failure. For
many use cases, format validation alone may be sufficient, with MX checks reserved for critical
validations or lower-volume scenarios.
