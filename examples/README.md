# node-email-verifier Examples

This directory contains practical examples demonstrating various use cases for the
node-email-verifier library.

## Getting Started

First, ensure you've installed the library:

```bash
npm install node-email-verifier
```

## Available Examples

### 1. [basic-validation.js](./basic-validation.js)

#### Simple Email Validation

- Basic boolean validation results
- MX record checking
- Helper function patterns

```bash
node examples/basic-validation.js
```

### 2. [typescript-usage.ts](./typescript-usage.ts)

#### TypeScript Integration

- Type-safe validation with full type imports
- Custom validation service class
- Error handling with TypeScript types
- Batch validation with type safety

```bash
# Install tsx if needed: npm install -g tsx
tsx examples/typescript-usage.ts

# Or compile and run with TypeScript:
npx tsc examples/typescript-usage.ts --module esnext --target es2022
node examples/typescript-usage.js
```

### 3. [bulk-validation.js](./bulk-validation.js)

#### Bulk Email Processing

- Sequential validation with progress tracking
- Concurrent validation with concurrency limits
- Streaming validation for large datasets
- Performance statistics and reporting

```bash
node examples/bulk-validation.js
```

### 4. [error-handling.js](./error-handling.js)

#### Comprehensive Error Handling

- Error code system usage (v3.2.0+)
- Custom error handler classes
- Retry logic with exponential backoff
- User-friendly error messages

```bash
node examples/error-handling.js
```

### 5. [commonjs-usage.cjs](./commonjs-usage.cjs)

#### CommonJS Compatibility

- Traditional `require()` syntax
- Promise and callback patterns
- Integration with older Node.js projects
- Express middleware examples

```bash
node examples/commonjs-usage.cjs
```

### 6. [debug-mode.js](./debug-mode.js)

#### AI Debug Mode (v3.3.0+)

- Structured JSON logging for debugging
- Performance timing and memory usage tracking
- Production-ready debug wrapper class
- MCP-compatible format for AI tooling

```bash
node examples/debug-mode.js
```

### 7. [enhanced-types.js](./enhanced-types.js)

#### Enhanced TypeScript Types (v3.4.0+)

- Using EmailValidationError class and type guard
- Handling specific error codes programmatically
- Working with MxRecord type in detailed results
- Creating custom validation errors

```bash
node examples/enhanced-types.js
```

### 8. [mx-caching.js](./mx-caching.js)

#### MX Record Caching (v3.4.0+)

- Built-in TTL-based caching for improved performance
- Cache management and statistics
- Bulk validation performance optimization
- TTL expiration and cache eviction

```bash
node examples/mx-caching.js
```

## Key Features Demonstrated

### Email Validation Options

```javascript
const options = {
  checkMx: true, // Verify MX records
  checkDisposable: true, // Block temporary emails
  detailed: true, // Get detailed results
  timeout: 5000, // Custom timeout (ms)
  debug: false, // Enable debug logging (v3.3.0+)
  cache: {
    enabled: true, // Enable MX caching (v3.4.0+)
    defaultTtl: 300000, // TTL in milliseconds
    maxSize: 1000, // Maximum cache entries
  },
};
```

### Error Codes (v3.2.0+)

```javascript
import { ErrorCode } from 'node-email-verifier';

// Available error codes:
ErrorCode.INVALID_EMAIL_FORMAT;
ErrorCode.NO_MX_RECORDS;
ErrorCode.DNS_LOOKUP_TIMEOUT;
ErrorCode.DISPOSABLE_EMAIL;
// ... and more
```

### Return Types

```javascript
// Simple validation (returns boolean)
const isValid = await emailValidator('test@example.com');

// Detailed validation (returns object)
const result = await emailValidator('test@example.com', { detailed: true });
// result.valid - boolean
// result.reason - string explanation
// result.errorCode - specific error code
```

## Common Patterns

### Validation Function

```javascript
import emailValidator from 'node-email-verifier';

async function validateEmail(email) {
  try {
    const result = await emailValidator(email, {
      checkMx: true,
      checkDisposable: true,
    });
    return { success: true, valid: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Batch Processing

```javascript
import emailValidator from 'node-email-verifier';

const emails = ['email1@test.com', 'email2@test.com'];
const results = await Promise.all(emails.map((email) => emailValidator(email, { detailed: true })));
```

## Performance Tips

1. **Use concurrency limits** for bulk validation
2. **Set appropriate timeouts** for your use case
3. **Enable MX caching** for repeated domain validations (enabled by default in v3.4.0+)
4. **Use streaming** for very large email lists
5. **Monitor cache statistics** to optimize TTL and size settings

## Support

For more information, see the [main documentation](../README.md).
