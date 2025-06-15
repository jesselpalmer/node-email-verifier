# Feature Enhancement Roadmap

This document outlines potential enhancements to the Node Email Verifier library based on common use cases and developer needs.

## Priority 1: High-Impact Features

### ✅ Disposable Email Detection

**Status**: Implemented in v3.1.0  
**Description**: Detect and optionally block temporary/throwaway email services  
**Use Case**: Prevent spam registrations and improve user data quality  
**Implementation**: Curated list of 600+ known disposable email providers

**Usage**:

```js
await emailValidator('test@10minutemail.com', { checkDisposable: true }) // → false
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
  checkDisposable: true 
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

## Priority 2: Advanced Features

### Domain Typo Suggestions

**Status**: Planned  
**Description**: Suggest corrections for common domain typos  
**Use Case**: Improve user experience by catching typos (gmail.con → gmail.com)  
**Implementation**: Levenshtein distance algorithm with common domain database

### Email Normalization

**Status**: Planned  
**Description**: Standardize email formats for consistent storage  
**Use Case**: Prevent duplicate accounts with same logical email  
**Implementation**: Remove Gmail dots, convert to lowercase, handle plus addressing

### MX Record Caching

**Status**: Planned  
**Description**: Cache DNS lookup results to improve performance  
**Use Case**: Reduce API calls and improve response times for bulk validation  
**Implementation**: TTL-based in-memory cache with configurable expiration

### SMTP Connection Testing

**Status**: Planned  
**Description**: Test actual mail server connectivity beyond MX records  
**Use Case**: More accurate validation of email deliverability  
**Implementation**: Attempt SMTP connection without sending email

### Role-based Email Address Detection

**Status**: Planned  
**Description**: Identify generic/role-based email addresses  
**Use Case**: Flag addresses like admin@, noreply@, support@ for business validation  
**Implementation**: Pattern matching against common role-based prefixes

## Priority 3: Developer Experience

### Validation Profiles

**Status**: Planned  
**Description**: Preset validation configurations for different use cases  
**Use Case**: Quick setup for common scenarios (strict, lenient, business)  
**Profiles**:

- `strict`: All validations enabled, short timeouts

  ```js
  emailValidator(email, 'strict'); // or { profile: 'strict' }
  // Equivalent to: { checkMx: true, checkDisposable: true, timeout: '2s' }
  ```

- `lenient`: Format validation only, no MX checking

  ```js
  emailValidator(email, 'lenient');
  // Equivalent to: { checkMx: false, checkDisposable: false }
  ```

- `business`: Block disposable emails, detect role accounts

  ```js
  emailValidator(email, 'business');
  // Equivalent to: { checkMx: true, checkDisposable: true, checkRole: true }
  ```

- `fast`: Minimal validation for high-throughput scenarios

  ```js
  emailValidator(email, 'fast');
  // Equivalent to: { checkMx: false, timeout: '500ms' }
  ```

### Email Provider Detection

**Status**: Planned  
**Description**: Identify major email providers (Gmail, Outlook, Yahoo, etc.)  
**Use Case**: Analytics and provider-specific handling  
**Implementation**: Domain-to-provider mapping with confidence scores

### Bulk Validation Optimization

**Status**: Planned  
**Description**: Efficient batch processing with domain grouping  
**Use Case**: Validate large email lists with optimized DNS queries  
**Implementation**: Group emails by domain, parallel processing with rate limiting

### Domain Allowlist/Blocklist

**Status**: Planned  
**Description**: Custom domain filtering capabilities  
**Use Case**: Corporate environments with specific domain requirements  
**Implementation**: User-configurable domain lists with wildcards

### Built-in Logging/Metrics

**Status**: Planned  
**Description**: Optional telemetry for monitoring validation patterns  
**Use Case**: Track validation performance and failure patterns  
**Implementation**: Structured logging with configurable levels

### Rate Limiting

**Status**: Planned  
**Description**: Built-in DNS query throttling  
**Use Case**: Respect DNS server limits and prevent abuse  
**Implementation**: Token bucket algorithm with configurable rates

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
  detailed: true,          // Opt-in for detailed results
  checkDisposable: true    // Opt-in for disposable checking
});
// Returns: ValidationResult object

// Disposable checking with boolean return (no breaking change)
const isValid = await emailValidator('test@10minutemail.com', { 
  checkDisposable: true 
});
// Returns: false (boolean)
```

#### Future Considerations

**Potential Breaking Changes** (not planned, dependent on user feedback):

- **v4.0.0 (hypothetical)**: Make `detailed: true` the default
- **v5.0.0 (hypothetical)**: Remove boolean return option entirely

**Current Approach**: Keep boolean returns as the default indefinitely based on user preference for simplicity.

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

Priority and implementation order may change based on community feedback and real-world usage patterns.
