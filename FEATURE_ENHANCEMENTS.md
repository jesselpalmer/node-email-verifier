# Feature Enhancement Roadmap

_This roadmap outlines planned enhancements for the node-email-verifier library. It reflects our
priorities based on community feedback and common developer use cases._

_Last Updated: June 2025_

---

## ✅ Recently Shipped

### ✅ Disposable Email Detection (3.1.0)

Detects and blocks throwaway/disposable email services.

- Supports 600+ providers via curated list
- Used to prevent spam and improve data quality

### ✅ Detailed Validation Results (3.1.0)

Returns structured objects instead of just boolean.

- Includes format check, MX status, disposable info
- Improves debuggability and analytics

### ✅ Error Codes and Typed Errors (3.2.0)

Added `ErrorCode` enum and `EmailValidationError` class.

- Enables programmatic error handling
- Improves DX for API consumers

---

## ✅ 3.3.0 – Released June 2025

### ✅ Examples Directory

Added real-world usage examples:

- `basic-validation.js` - Basic email validation patterns
- `typescript-usage.ts` - Full TypeScript integration with types
- `bulk-validation.js` - Bulk email processing strategies
- `error-handling.js` - Comprehensive error handling
- `commonjs-usage.cjs` - CommonJS compatibility examples
- `debug-mode.js` - AI Debug Mode usage and production patterns

### ✅ AI Debug Mode

Added `debug: true` option for enhanced debugging and observability.

- Structured JSON logs with MCP-compatible format
- Performance timing for each validation phase
- Memory usage tracking (heap, RSS, external)
- Detailed error logging with stack traces
- Production-ready debug wrapper example

### ✅ Comprehensive Error Handling Tests (PR #50)

Added extensive test coverage for error handling edge cases:

- **DNS Error Scenarios**: ECONNREFUSED, ETIMEDOUT, ENOTFOUND, NXDOMAIN, NODATA, circular CNAME
- **Network Errors**: ENETUNREACH correctly classified as MX_LOOKUP_FAILED
- **Race Conditions**: Timeout vs DNS resolution, concurrent validations
- **Memory Management**: Bulk validation pressure, allocation failures, memory leak prevention
- **Transient Failures**: Network instability, jittery conditions, retry logic
- **Edge Cases**: Malformed DNS responses, invalid timeout values
- Added `classifyDnsError` helper for centralized error classification
- Improved type safety with `TestEmailValidatorOptions` interface
- 208 tests now passing with deterministic behavior across CI environments

---

## ✅ 3.4.0 – Ready for Release

_Note: This version is feature-complete and awaiting release. The MX caching implementation has been
thoroughly tested and reviewed._

### ✅ MX Record Caching with LRU Eviction (PR #51)

Dramatically improved performance for repeated validations:

- **7.7x faster** performance with realistic DNS latency
- **87%+ cache hit rate** in typical usage patterns
- **LRU eviction strategy** that keeps frequently accessed domains in memory longer
- Cache MX records per domain with configurable TTL (default 5 minutes)
- Cache statistics in detailed results for monitoring
- Manual cache management (flush, delete entries, reset statistics)
- Performance benchmarks showing real-world improvements

### ✅ Enhanced TypeScript Support & Documentation (PR #57)

Improved developer experience and integration:

- ✅ Export `MxRecord` interface and other useful types (`ValidationResult`,
  `EmailValidatorOptions`, `CacheStatistics`, `MxCacheOptions`)
- ✅ Export `EmailValidationError` class and `isEmailValidationError` helper function for better
  error handling
- ✅ Comprehensive JSDoc comments on all public APIs
- ✅ Document all possible errors with examples in README
- ✅ Edge case documentation and error code examples

---

## 🚀 Next Release – 3.5.0

### 🎛️ Validation Profiles

Pre-configured modes for common use cases:

- `strict`: full validation with timeouts
- `lenient`: format only
- `business`: block disposable + role emails
- `fast`: optimized for high throughput
- Clear options instead of overloaded parameters

### 🛡️ Enhanced Disposable Detection

Upgrade domain coverage and logic:

- Expand database from 600+ → 3,000+ domains
- Add wildcard and pattern matching
- Enable auto-updating disposable list

---

## 🧪 Medium-Term (3.6.0+)

### 🔌 SMTP Connection Testing

- Validate whether mail server is accepting connections
- Does not send emails
- Optional setting due to latency cost

### 👤 Role-Based Email Detection

- Detect generic addresses like `admin@`, `noreply@`, `support@`
- Pattern list customizable
- Included in detailed validation output

### 🚦 Built-in Rate Limiting

- DNS query throttling to avoid network abuse
- Token bucket system
- Per-domain caps + global fallback

---

## 🔮 Long-Term Vision

### 🧠 Email Provider Detection

- Identify major providers (Gmail, Outlook, etc.)
- Enable provider-specific rules
- Analytics and dashboards planned for hosted API users

### 🧩 Bulk Validation Optimization

- Domain-based grouping
- Streaming validation support
- Parallel resolution with TTL cache
- Real-time progress callbacks

### ⛔ Domain Allowlist/Blocklist

- Developer-defined filters
- Wildcard pattern support
- Import/export configuration

### ⚙️ Advanced TypeScript Support

- Branded types for valid emails
- Utility types for inferred usage
- Internal helper type exports

---

## 🔄 Versioning Philosophy

- We follow SemVer (semantic versioning)
- All new features are **opt-in** to avoid breaking changes
- Boolean validation (`true/false`) will remain supported indefinitely
- Detailed structured output will become default **only if community strongly prefers**

---

## 🧠 Contributing

We welcome feedback, requests, and contributions!

- 📣 Open an issue for features or bugs
- 🔧 Send PRs for new validation logic or docs
- 💬 Share your use cases — we prioritize based on real-world need
