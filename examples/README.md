# node-email-verifier Examples

This directory contains practical examples demonstrating various use cases for the
node-email-verifier library.

## Getting Started

First, ensure you've installed the dependencies:

```bash
npm install
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

## Key Features Demonstrated

### Email Validation Options

```javascript
const options = {
  checkMx: true, // Verify MX records
  checkDisposable: true, // Block temporary emails
  detailed: true, // Get detailed results
  timeout: 5000, // Custom timeout (ms)
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
const emails = ['email1@test.com', 'email2@test.com'];
const results = await Promise.all(emails.map((email) => emailValidator(email, { detailed: true })));
```

## Performance Tips

1. **Use concurrency limits** for bulk validation
2. **Set appropriate timeouts** for your use case
3. **Cache results** when validating the same emails repeatedly
4. **Use streaming** for very large email lists

## Support

For more information, see the [main documentation](../README.md).
