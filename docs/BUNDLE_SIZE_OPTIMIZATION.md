# Bundle Size Optimization

This document describes the bundle size optimizations implemented in node-email-verifier,
particularly the lazy loading of disposable email domains.

## Overview

The disposable domains list contains 600+ domains, contributing approximately 14KB (31%) to the
total bundle size. To optimize initial load time and reduce bundle size for applications that don't
use disposable email checking, we've implemented lazy loading for this feature.

## Implementation

### Lazy Loading Architecture

The disposable domains are now loaded on-demand using dynamic imports:

```typescript
// disposable-checker.ts
async function loadDisposableDomains(): Promise<Set<string>> {
  if (disposableDomainsSet !== null) {
    return disposableDomainsSet;
  }

  // Dynamic import only when needed
  const module = await import('./disposable-domains.js');
  disposableDomainsSet = module.disposableDomains;
  return disposableDomainsSet;
}
```

### Benefits

1. **Reduced Initial Bundle Size**: Applications that don't use `checkDisposable` won't load the
   14KB domains list
2. **Faster Parse Time**: Less JavaScript to parse on initial load
3. **Better Code Splitting**: Bundlers can create separate chunks for the domains
4. **Backward Compatible**: The API remains unchanged

## Usage

### Basic Usage (No Changes Required)

```javascript
// The domains are loaded automatically when needed
const result = await emailValidator('test@10minutemail.com', {
  checkDisposable: true,
  detailed: true,
});
```

### Performance Optimization

For performance-critical paths, you can preload the domains:

```javascript
import { preloadDisposableDomains } from 'node-email-verifier';

// During app initialization
await preloadDisposableDomains();

// Later validations will be faster
const result = await emailValidator('test@example.com', {
  checkDisposable: true,
});
```

## Performance Impact

### Bundle Size Reduction

- **Before**: 46.2KB total bundle
- **After**: 32.9KB initial bundle (domains loaded on-demand)
- **Savings**: 14.3KB (31% reduction) for apps not using disposable checking

### Load Time Impact

- **First Check**: ~5-10ms additional latency for dynamic import
- **Subsequent Checks**: No additional latency (domains cached in memory)
- **With Preloading**: No latency impact

## Migration Guide

No changes are required for existing code. The lazy loading is transparent to the API consumer.

### TypeScript Users

The types remain the same. The only change is that `isDisposableDomain` is now async internally, but
this is handled by the main validation function.

## Future Optimizations

1. **Domain Compression**: Further reduce size using domain suffix compression
2. **Streaming Loading**: Load domains in chunks for very large lists
3. **CDN Loading**: Option to load domains from CDN for web environments
4. **Custom Domain Lists**: Allow users to provide their own domain lists

## Technical Details

### Module Structure

```text
src/
├── index.ts                    # Main entry point
├── disposable-domains.ts       # The domains list (lazy loaded)
├── disposable-checker.ts       # Lazy loading logic
└── ...
```

### Webpack/Bundler Configuration

Modern bundlers will automatically recognize the dynamic import and create a separate chunk:

```javascript
// webpack output
main.js         // 32.9KB - Main bundle
0.chunk.js      // 14.3KB - Disposable domains (loaded on demand)
```

## Benchmarks

```javascript
// Initialization time (first load)
Without disposable checking: 12ms
With disposable checking (lazy): 17ms (+5ms for dynamic import)
With preloading: 12ms (no impact)

// Memory usage
Without domains loaded: 2.1MB
With domains loaded: 2.2MB (+100KB for Set structure)
```

## Best Practices

1. **Don't Preload Unless Necessary**: Only preload if you know you'll check many disposable emails
2. **Use checkDisposable Sparingly**: Only enable when you specifically need to block disposable
   emails
3. **Consider Caching**: Results are not cached by default, consider implementing your own cache
   layer

## Compatibility

- **Node.js**: Full support for dynamic imports (14.0+)
- **Browsers**: Requires bundler support for dynamic imports
- **CommonJS**: Automatically handled by build process
- **ES Modules**: Native support
