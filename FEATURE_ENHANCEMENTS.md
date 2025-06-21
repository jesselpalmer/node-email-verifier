# Feature Enhancement Roadmap

This document outlines planned enhancements to the Node Email Verifier library. Features are
prioritized based on community feedback and common use cases.

_Last Updated: January 2025_

## Priority 1: High-Impact Features

### ✅ Disposable Email Detection

**Status**: Implemented in v3.1.0  
**Description**: Detect and optionally block temporary/throwaway email services  
**Use Case**: Prevent spam registrations and improve user data quality  
**Implementation**: Curated list of 600+ known disposable email providers

**Usage**:

```js
await emailValidator('test@10minutemail.com', { checkDisposable: true }); // → false
```

### ✅ Detailed Validation Results

**Status**: Implemented in v3.1.0  
**Description**: Return detailed validation information instead of just boolean  
**Use Case**: Better error messaging and debugging for developers  
**Implementation**: Return object with validation status, error reasons, and metadata

**Usage**:

```js
const result = await emailValidator('test@example.com', { detailed: true });
// → { valid: true, email: '...', format: {...}, mx: {...}, disposable: {...} }
```

**Detailed ValidationResult Structure**:

```js
// Example for a failing disposable email
const result = await emailValidator('test@10minutemail.com', {
  detailed: true,
  checkMx: true,
  checkDisposable: true,
});

/* Returns:
{
  "valid": false,
  "email": "test@10minutemail.com",
  "format": {
    "valid": true
  },
  "mx": {
    "valid": true,
    "records": [
      { "exchange": "mx.10minutemail.com", "priority": 10 }
    ]
  },
  "disposable": {
    "valid": false,
    "provider": "10minutemail.com",
    "reason": "Email from disposable provider"
  }
}
*/

// Example for an invalid format
const result2 = await emailValidator('invalid-email', { detailed: true });
/* Returns:
{
  "valid": false,
  "email": "invalid-email",
  "format": {
    "valid": false,
    "reason": "Invalid email format"
  }
  // mx and disposable fields omitted when checks are disabled
}
*/
```

### ✅ Error Codes and Enhanced Error Handling

**Status**: Implemented in v3.2.0  
**Description**: Comprehensive error code system for programmatic error handling  
**Use Case**: Better error handling and debugging in production applications  
**Implementation**: `ErrorCode` enum with `EmailValidationError` class

**Usage**:

```js
try {
  await emailValidator('test@example.com', { timeout: -1 });
} catch (error) {
  if (error.code === ErrorCode.INVALID_TIMEOUT_VALUE) {
    console.log('Invalid timeout configuration');
  }
}
```

## 🚀 Planned Features

### Priority 1: Next Release (v3.3.0)

#### Examples Directory

Create comprehensive examples for common use cases:

- `examples/basic-validation.js` - Simple email validation
- `examples/typescript-usage.ts` - TypeScript integration
- `examples/bulk-validation.js` - Validating email lists
- `examples/error-handling.js` - Handling validation errors
- `examples/commonjs-usage.cjs` - CommonJS compatibility

#### Enhanced Disposable Email Detection

**Community Request**: Expand disposable email detection capabilities

- Increase database from 600+ to 3,000+ domains
- Add pattern matching for dynamic domains
- Support wildcards for provider variants
- Implement auto-update mechanism

### Priority 2: Near Term

#### Domain Typo Suggestions

- Detect and suggest corrections for common typos (gmail.con → gmail.com)
- Use Levenshtein distance algorithm
- Configurable suggestion threshold
- Return suggestions in validation results

#### Email Normalization

- Remove dots in Gmail addresses
- Handle plus addressing across providers
- Case normalization
- Provider-specific normalization rules

#### MX Record Caching

- In-memory TTL-based cache
- Configurable expiration times
- Cache hit/miss statistics
- Manual cache clearing option

### Priority 3: Medium Term

#### Validation Profiles

Pre-configured validation settings for common use cases:

- `strict` - All validations enabled, short timeouts
- `lenient` - Format validation only
- `business` - Block disposable and role-based emails
- `fast` - Minimal checks for high throughput

#### SMTP Connection Testing

- Verify mail server accepts connections
- No actual email sending
- Configurable connection depth
- Additional validation accuracy

#### Role-based Email Detection

- Identify generic addresses (admin@, noreply@, support@)
- Configurable role patterns
- Include in detailed validation results

#### Built-in Rate Limiting

- DNS query throttling
- Token bucket algorithm
- Per-domain rate limits
- Prevent DNS server blocking

### Priority 4: Long Term

#### Email Provider Detection

- Identify major providers (Gmail, Outlook, Yahoo)
- Provider-specific validation rules
- Analytics and reporting capabilities

#### Bulk Validation Optimization

- Efficient batch processing
- Domain-based grouping
- Parallel validation with rate limiting
- Progress callbacks

#### Domain Allowlist/Blocklist

- Custom domain filtering
- Wildcard support
- Import/export functionality
- Runtime configuration

#### Advanced TypeScript Support

- Branded types for validated emails
- Better type inference
- Utility types for common patterns

## Implementation Notes

### Breaking Changes

#### No Breaking Changes in v3.1.0 ✅

All new features have been implemented as **opt-in enhancements** with full backward compatibility:

```js
// v3.0.0 code continues to work exactly the same
const isValid = await emailValidator('test@example.com');
// Returns: true | false

// New features are opt-in only
const result = await emailValidator('test@example.com', {
  detailed: true, // Opt-in for detailed results
  checkDisposable: true, // Opt-in for disposable checking
});
// Returns: ValidationResult object

// Disposable checking with boolean return (no breaking change)
const isValid = await emailValidator('test@10minutemail.com', {
  checkDisposable: true,
});
// Returns: false (boolean)
```

#### Future Considerations

**Potential Breaking Changes** (not planned, dependent on user feedback):

- **v4.0.0 (hypothetical)**: Make `detailed: true` the default
- **v5.0.0 (hypothetical)**: Remove boolean return option entirely

**Current Approach**: Keep boolean returns as the default indefinitely based on user preference for
simplicity.

### Performance Considerations

- All new features should be opt-in to maintain current performance
- DNS caching should significantly improve bulk validation performance
- SMTP testing will add latency but provide more accurate results

### Dependencies

- Consider adding minimal dependencies for new features
- Evaluate bundle size impact for each enhancement
- Maintain tree-shaking compatibility

## Feedback and Contributions

We welcome feedback on these proposed enhancements. Please:

1. Open an issue to discuss specific features
2. Share your use cases and requirements
3. Contribute implementations via pull requests

Priority and implementation order may change based on community feedback and real-world usage
patterns.
