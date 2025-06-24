# Release Instructions for 3.4.0

> Note: For the complete release process guide, see [RELEASE_PROCESS.md](/RELEASE_PROCESS.md)

## Pre-Flight Checks

Before starting the release process, ensure:

```bash
# Verify clean working directory
git status  # Should show "nothing to commit, working tree clean"

# Verify on main branch with latest changes
git checkout main
git pull origin main

# Verify npm authentication
npm whoami  # Should show your npm username
# If not logged in: npm login

# Run all checks to ensure release readiness
npm run check
```

## Pre-Release Checklist

### 1. Code Quality

- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint:all`
- [ ] Code formatted: `npm run format:check`
- [ ] Full check passes: `npm run check`

### 2. Documentation Review

- [ ] README.md is up to date with performance numbers
- [ ] CHANGELOG.md has all changes documented
- [ ] API documentation reflects MX caching features
- [ ] Examples in the examples/ directory work
- [ ] MX caching example is functional

### 3. Feature Validation

- [ ] MX caching is working correctly
- [ ] LRU eviction strategy is implemented
- [ ] Cache statistics are being tracked
- [ ] Performance benchmarks show expected improvements
- [ ] Global cache management functions work
- [ ] Enhanced TypeScript exports work correctly
- [ ] Error handling utilities are exported and functional

### 4. Version Bump

- [ ] package.json version updated to 3.4.0
- [ ] package-lock.json updated accordingly

## Release Steps

### 1. Update Version

```bash
# Update version in package.json and package-lock.json
npm version 3.4.0 --no-git-tag-version

# Commit version bump
git add package.json package-lock.json
git commit -m "chore: bump version to 3.4.0"
```

### 2. Update CHANGELOG

Move items from "Unreleased" to "3.4.0" section:

```markdown
## [3.4.0] - 2025-06-23

### Added

- MX Record Caching with LRU Eviction Strategy:
  - TTL-based caching with configurable default TTL (5 minutes) and max cache size (1000 entries)
  - LRU (Least Recently Used) eviction strategy that keeps frequently accessed domains in memory
  - Cache statistics tracking (hits, misses, evictions, hit rate) included in detailed validation
    results
  - Global cache management with flush, delete, and reset statistics methods
  - **7.7x performance improvement** with realistic DNS latency (25ms)
  - **87%+ cache hit rate** in typical usage patterns with mixed domain popularity
  - **872 DNS lookups avoided** out of 1000 requests (87.2% reduction)
  - Automatic periodic cleanup of expired entries to prevent memory accumulation
  - Comprehensive performance benchmarks demonstrating real-world improvements
- Enhanced TypeScript Support:
  - Export `EmailValidationError` class and `isEmailValidationError` helper function for better
    error handling
  - All major interfaces and types now exported: `MxRecord`, `ValidationResult`,
    `EmailValidatorOptions`, `CacheStatistics`, `MxCacheOptions`
  - Comprehensive JSDoc documentation on all public APIs
```

### 3. Create Git Tag

```bash
# Create and push tag
git tag -a v3.4.0 -m "Release v3.4.0: MX Record Caching with LRU Eviction"
git push origin v3.4.0
```

### 4. Publish to npm

```bash
# Build and publish
npm run build
npm publish
```

### 5. Create GitHub Release

Use this content for the GitHub release:

````markdown
# 🚀 v3.4.0: MX Record Caching with LRU Eviction

This release introduces high-performance MX record caching with LRU eviction strategy, delivering
dramatic performance improvements for email validation scenarios.

## 🎯 Key Features

### 💾 MX Record Caching with LRU Eviction

- **7.7x faster** performance with realistic DNS latency (25ms per lookup)
- **87%+ cache hit rate** in typical usage patterns with mixed domain popularity
- **872 DNS lookups avoided** out of 1000 requests (87.2% reduction)
- **65+ seconds saved** in real DNS lookup time per 1000 validations

### ⚡ Performance Benefits

- TTL-based caching with configurable settings (default: 5 minutes TTL, 1000 max entries)
- LRU (Least Recently Used) eviction strategy keeps frequently accessed domains in memory
- Automatic periodic cleanup of expired entries prevents memory accumulation
- Cache statistics included in detailed validation results for monitoring

### 🔧 Enhanced TypeScript Support

- Export `EmailValidationError` class and `isEmailValidationError` helper for better error handling
- All major interfaces now exported: `MxRecord`, `ValidationResult`, `EmailValidatorOptions`,
  `CacheStatistics`, `MxCacheOptions`
- Comprehensive JSDoc documentation on all public APIs

```typescript
import emailValidator, {
  EmailValidationError,
  isEmailValidationError,
  MxRecord,
  ValidationResult,
} from 'node-email-verifier';

// Better error handling
try {
  await emailValidator('test@example.com');
} catch (error) {
  if (isEmailValidationError(error)) {
    console.log('Validation error:', error.code);
  }
}
```
````

### 🛠️ Cache Management

```javascript
import { globalMxCache } from 'node-email-verifier';

// Get cache statistics
const stats = globalMxCache.getStatistics();
console.log(`Cache hit rate: ${stats.hitRate}%`);

// Clear entire cache
globalMxCache.flush();

// Clear specific domain
globalMxCache.delete('example.com');
```

### 📊 Real-World Impact

Benchmark results from 1000 email validations with mixed domain patterns:

- **No Cache**: 1000 DNS lookups, 26.1 seconds
- **LRU Cache**: 128 DNS lookups, 3.4 seconds
- **Result**: 7.7x performance improvement

## 🔧 Usage

Caching is enabled by default. Configure it with:

```javascript
const result = await emailValidator('test@example.com', {
  checkMx: true,
  detailed: true,
  cache: {
    enabled: true, // Enable caching (default: true)
    defaultTtl: 600000, // 10 minutes TTL (default: 5 minutes)
    maxSize: 5000, // Store up to 5000 domains (default: 1000)
  },
});

// Check if result was served from cache
if (result.mx?.cached) {
  console.log('MX records were served from cache');
}

// View cache statistics
console.log(result.cacheStats);
// { hits: 42, misses: 8, size: 50, evictions: 0, hitRate: 84.00 }
```

## 📈 Performance Benchmarks

This release includes comprehensive benchmarks demonstrating:

- Direct comparison of no cache vs LRU cache performance
- Performance scaling with different DNS latencies (0ms, 5ms, 25ms)
- Real-world usage patterns with domain popularity distribution

## 🔄 Breaking Changes

None - all features are opt-in and maintain backward compatibility.

## 📦 What's Next

See our [Feature Roadmap](FEATURE_ENHANCEMENTS.md) for upcoming enhancements in v3.5.0.

## Post-Release Checklist

### 1. Verify Release

- [ ] npm package published successfully
- [ ] GitHub release created with proper notes
- [ ] Documentation is live and accurate
- [ ] All links in release notes work

### 2. Update Branch Protection

- [ ] Merge PR into main branch
- [ ] Update any branch protection rules if needed

### 3. Communication

- [ ] Consider announcing on relevant forums/communities
- [ ] Update any external documentation that references the library

## Notes

This is a major performance enhancement that provides significant real-world benefits for
applications doing bulk email validation or repeated validations of the same domains.
