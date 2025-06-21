# Node Email Verifier Examples

This directory contains practical examples demonstrating various use cases and features of the
node-email-verifier library.

## 📚 Available Examples

### 1. [basic-validation.js](./basic-validation.js)

#### Basic Email Validation

- Simple boolean validation
- Validation with MX record checking
- Quick validation helper function

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
# Install ts-node if needed: npm install -g ts-node
ts-node examples/typescript-usage.ts
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

- Using the new ErrorCode enum (v3.2.0+)
- Custom error messages for user interfaces
- Retry logic for timeout errors
- Integration patterns for web frameworks

```bash
node examples/error-handling.js
```

### 5. [commonjs-usage.cjs](./commonjs-usage.cjs)

#### CommonJS Compatibility

- Using require() syntax
- Promise chains and callbacks
- Express middleware example
- Legacy Node.js compatibility

```bash
node examples/commonjs-usage.cjs
```

## 🚀 Running the Examples

### Prerequisites

1. Install node-email-verifier:

   ```bash
   npm install node-email-verifier
   ```

2. For TypeScript examples:

   ```bash
   npm install -g ts-node typescript
   ```

### Running Individual Examples

Each example can be run directly:

```bash
# ESM examples
node examples/basic-validation.js
node examples/bulk-validation.js
node examples/error-handling.js

# CommonJS example
node examples/commonjs-usage.cjs

# TypeScript example
ts-node examples/typescript-usage.ts
```

### Running from Project Root

If you're in the project root directory:

```bash
# After building the project
npm run build

# Run examples
node examples/basic-validation.js
```

## 📝 Key Features Demonstrated

### Email Validation Options

- **Basic validation**: Format checking only
- **MX record validation**: Verify domain can receive emails
- **Disposable email detection**: Block temporary email services
- **Timeout handling**: Control DNS lookup timeouts

### Error Handling (v3.2.0+)

- **Error codes**: Programmatic error identification
- **Custom error classes**: `EmailValidationError`
- **Type guards**: `isEmailValidationError()`
- **Detailed error messages**: User-friendly error descriptions

### Integration Patterns

- **Async/await**: Modern JavaScript patterns
- **Promises**: Traditional promise chains
- **Callbacks**: Legacy compatibility
- **Streaming**: Memory-efficient bulk processing

## 💡 Tips

1. **DNS Lookups**: MX record checks require network access and may be slow. Use appropriate
   timeouts.

2. **Rate Limiting**: When validating many emails, implement rate limiting to avoid overwhelming DNS
   servers.

3. **Error Recovery**: DNS lookups can fail temporarily. Implement retry logic for production
   systems.

4. **Disposable Emails**: The disposable email list is continuously updated. Keep your package up to
   date.

## 🔗 Additional Resources

- [API Documentation](../README.md)
- [Error Codes Reference](../README.md#error-handling)
- [npm Package](https://www.npmjs.com/package/node-email-verifier)
- [GitHub Repository](https://github.com/jesselpalmer/node-email-verifier)

## 🤝 Contributing

Have an interesting use case? Feel free to submit a PR with your example!

1. Create a new file: `examples/your-example.js`
2. Add clear comments explaining the use case
3. Update this README with a description
4. Submit a pull request
