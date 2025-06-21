# Performance Benchmarks

This document details the performance characteristics of the `node-email-verifier` library,
particularly focusing on the disposable domain lookup functionality.

## Running Benchmarks

The project includes comprehensive performance benchmarks:

```bash
# Run disposable domain lookup benchmark
npm run benchmark

# Run initialization and memory usage benchmark
npm run benchmark:init

# Run all benchmarks
npm run benchmark:all
```

## Results Summary

### Disposable Domain Lookups

The current Set-based implementation provides exceptional performance:

- **Speed**: 67+ million lookups per second
- **Time per lookup**: ~17 nanoseconds
- **Memory usage**: ~5KB for 661 domains
- **Complexity**: O(1) constant time

### Module Initialization

- **Load time**: ~0.3ms (median)
- **Memory per domain**: <1KB
- **First-time parse**: <1ms

### Comparison with Alternatives

| Implementation      | Time Complexity | Relative Performance      |
| ------------------- | --------------- | ------------------------- |
| Set.has() (current) | O(1)            | 1.0x (baseline)           |
| Binary search       | O(log n)        | ~7x slower                |
| Array.includes()    | O(n)            | ~661x slower (worst case) |

## Key Findings

1. **No optimization needed**: The current Set-based implementation is already optimal for this use
   case.

2. **No lazy loading required**: With initialization taking only ~0.3ms, lazy loading would add
   unnecessary complexity without meaningful benefits.

3. **Consistent performance**: Lookup time is constant regardless of whether the domain is
   disposable or not.

4. **Minimal memory footprint**: The entire disposable domains dataset uses less than 5KB of memory.

## Implementation Details

The disposable domains are stored in a JavaScript Set for O(1) lookup performance:

```javascript
// Pre-computed Set of disposable domains
const disposableDomains = new Set([
  '0-mail.com',
  '10minutemail.com',
  // ... 659 more domains
]);

// O(1) lookup
export function isDisposableDomain(domain) {
  return disposableDomains.has(domain.toLowerCase());
}
```

## Recommendations

Based on the benchmark results:

1. **Keep current implementation**: The Set-based approach is optimal.
2. **No lazy loading needed**: The 0.3ms initialization time is negligible.
3. **No caching required**: With 17ns lookups, caching would add overhead.
4. **Memory is not a concern**: 5KB for the entire dataset is minimal.

## Benchmark Scripts

- [`scripts/benchmark-disposable.js`](../scripts/benchmark-disposable.js) - Tests lookup performance
- [`scripts/benchmark-initialization.js`](../scripts/benchmark-initialization.js) - Tests
  initialization and memory usage

## Future Considerations

If the disposable domains list grows significantly (10,000+ domains), consider:

1. **Bloom filter**: For even more memory-efficient lookups with acceptable false positive rates
2. **Trie structure**: If prefix-based matching becomes important
3. **Split loading**: Load domains in chunks if initialization time becomes an issue

However, with the current dataset size, these optimizations would be premature.
