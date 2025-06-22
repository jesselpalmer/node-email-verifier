# GitHub Copilot Instructions for node-email-verifier

## Project Overview

You are working on `node-email-verifier`, a TypeScript email validation library that:

- Validates email format (RFC 5322)
- Checks MX records for domain validity
- Detects disposable/temporary email providers
- Supports both ESM and CommonJS

## Code Generation Guidelines

### TypeScript Preferences

- Always use strict TypeScript types
- Avoid `any` type except in test files
- Export interfaces for public APIs
- Use type guards for runtime type checking

### Function Patterns

```typescript
// Preferred async pattern
const functionName = async (param: Type, options: OptionsType = {}): Promise<ReturnType> => {
  // Destructure options with defaults
  const { opt1 = default1, opt2 = default2 } = options;

  // Early returns for validation
  if (!isValid(param)) {
    return { valid: false, reason: 'Invalid input' };
  }

  // Main logic
  try {
    const result = await operation();
    return { valid: true, data: result };
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
```

### Testing Patterns

```typescript
describe('Feature', () => {
  test('should behave correctly when condition', async () => {
    // Arrange
    const input = 'test@example.com';
    const options = { checkMx: true };

    // Act
    const result = await emailValidator(input, options);

    // Assert
    expect(result).toBe(true);
  });
});
```

## Common Operations

### Adding a new validation option

1. Update `EmailValidatorOptions` interface in src/index.ts
2. Add default value in function destructuring
3. Implement validation logic
4. Add tests for new option
5. Update README with example

### Adding disposable domains

1. Add to `disposableDomains` Set in src/disposable-domains.ts
2. Keep alphabetically ordered
3. Verify domain is actually disposable
4. Run tests to ensure no duplicates

### Updating dependencies

```bash
npm outdated          # Check what needs updating
npm update           # Update minor versions
npm install pkg@latest --save-dev  # Update specific package
npm run check        # Verify everything works
```

## Error Handling

- Always provide descriptive error messages
- Use consistent error message constants
- Never expose sensitive data in errors
- Maintain backward compatibility

## Performance Tips

- Domain lookups use Set for O(1) performance
- DNS queries can be slow - respect timeouts
- Consider caching for production usage
- Batch validations when possible

## File Structure

```text
src/
  index.ts              # Main validator function
  disposable-domains.ts # Disposable email list
test/
  index.test.ts        # Main test suite
  build-cjs.test.ts    # CommonJS compatibility tests
dist/                  # Build output (git ignored)
scripts/
  build-cjs.js         # CommonJS wrapper generator
```

## Do's and Don'ts

### Do

- ✅ Run `npm run check` before committing
- ✅ Add tests for new features
- ✅ Update TypeScript types
- ✅ Keep backward compatibility
- ✅ Document breaking changes

### Don't

- ❌ Use console.log in source code
- ❌ Commit without running tests
- ❌ Add dependencies without discussion
- ❌ Break existing API contracts
- ❌ Store email addresses

## Quick Commands

```bash
npm run build        # Build TypeScript
npm test            # Run tests
npm run lint:fix    # Fix linting issues
npm run format      # Format code
npm run check       # Run all checks
```

## Important Design Decisions

### Error Testing Patterns in Jest

We use a **mixed approach** for error testing, which is intentional and appropriate:

1. **Simple error message checking**: Use `.rejects.toThrow()`

   ```javascript
   await expect(emailValidator(...)).rejects.toThrow('DNS lookup timed out');
   ```

2. **Error property checking**: Use `.rejects.toMatchObject()`

   ```javascript
   await expect(emailValidator(...)).rejects.toMatchObject({
     name: 'EmailValidationError',
     code: ErrorCode.DNS_LOOKUP_TIMEOUT,
     message: 'DNS lookup timed out'
   });
   ```

3. **Complex multi-assertion scenarios**: Use `try/catch` with `fail()`

   ```javascript
   try {
     await emailValidator(...);
     fail('Should have thrown an error');
   } catch (error) {
     expect(error).toBeInstanceOf(EmailValidationError);
     expect(error.code).toBe(ErrorCode.DNS_LOOKUP_TIMEOUT);
     // Additional complex assertions...
   }
   ```

**❌ NEVER do this** (multiple rejects calls on same promise):

```javascript
const promise = emailValidator(...);
await expect(promise).rejects.toBeInstanceOf(EmailValidationError);
await expect(promise).rejects.toMatchObject({ code: ErrorCode.SOMETHING });
```

### String Matching in extractErrorCode Function

The `extractErrorCode` function in `src/errors.ts` uses string matching as a **fallback mechanism**
for external errors. This is intentional and documented:

- The function includes clear documentation about its limitations
- It recommends using `createValidationError()` for deterministic error codes
- String matching is only used for errors from external sources (like DNS)
- The pattern matching is ordered from most specific to least specific to minimize misclassification

This approach is necessary because we cannot control error messages from external systems like DNS
resolvers.

### TypeScript Import Extensions

The `.js` extension in TypeScript imports is **correct and required** for ESM modules with
`"moduleResolution": "NodeNext"`. Do not suggest removing `.js` extensions from import statements.

### Test File Type Assertions

The `as any` type assertions in test files are intentional to access internal testing APIs (like
`_resolveMx`). This is an acceptable pattern for testing internal functionality.

### Error Code Organization

The ErrorCode enum in `src/errors.ts` uses comment sections to organize related error codes:

```typescript
export enum ErrorCode {
  // Format validation errors
  EMAIL_MUST_BE_STRING = 'EMAIL_MUST_BE_STRING',
  EMAIL_CANNOT_BE_EMPTY = 'EMAIL_CANNOT_BE_EMPTY',

  // MX record validation errors
  NO_MX_RECORDS = 'NO_MX_RECORDS',
  // ... etc
}
```

These comment sections are **intentional and should be kept**. They help developers quickly find
related error codes and understand the error hierarchy. Do not suggest removing these as "redundant
comments".

### Timeout Test Patterns

The timeout tests in `test/index.test.ts` intentionally use try/catch blocks:

```typescript
test('should timeout MX record check with string timeout and throw EmailValidationError', async () => {
  try {
    await emailValidator('test@example.com', {
      timeout: '1ms',
      _resolveMx: slowMockResolveMx,
    } as any);
    fail('Should have thrown an error');
  } catch (error) {
    expect(error).toBeInstanceOf(EmailValidationError);
    expect(error.message).toBe('DNS lookup timed out');
    expect(error).toMatchObject({
      code: ErrorCode.DNS_LOOKUP_TIMEOUT,
    });
  }
});
```

This pattern is **correct and intentional** for timeout tests because:

1. They need to assert multiple properties (instanceof, message, and code)
2. The try/catch pattern is documented above as appropriate for complex multi-assertion scenarios
3. Using `.rejects` would require multiple awaits on the same promise, which is an anti-pattern

Do not suggest changing these to `.rejects` patterns.

### Using expect.assertions() in Tests

When using try/catch blocks in tests, include `expect.assertions(n)` at the beginning to ensure all
assertions run:

```typescript
test('should throw an error', async () => {
  expect.assertions(3); // Ensures exactly 3 assertions are called
  try {
    await someFunction();
    fail('Should have thrown an error');
  } catch (error) {
    expect(error).toBeInstanceOf(SomeError);
    expect(error.message).toBe('Expected message');
    expect(error.code).toBe('ERROR_CODE');
  }
});
```

This is especially important for:

- Tests that should throw errors
- Tests with multiple assertions in catch blocks
- Loop-based tests (multiply assertions by iterations)

### Documentation Consistency

The README.md error codes section is **intentionally kept in sync** with the `ErrorCode` enum in
`src/errors.ts`. All error codes are documented correctly:

- `EMAIL_CANNOT_BE_EMPTY` is the correct error code (not `EMAIL_EMPTY`)
- The "Available Error Codes" section in README.md lists all codes from the ErrorCode enum
- Do not suggest changes to error code names unless they actually differ from the source

### Roadmap Document Formatting

The `FEATURE_ENHANCEMENTS.md` formatting is **intentionally designed** for clarity:

- Emoji usage is consistent: ✅ for completed features, 🚀 for next release, 🔜 for near-term, etc.
- Section headers use markdown horizontal rules (`---`) for visual separation
- Feature items use contextual emojis (📁 for files, 🧠 for AI/smart features, 🛡️ for security)
- This formatting improves readability and helps developers quickly scan the roadmap

Do not suggest formatting changes to the roadmap unless there are actual inconsistencies or
accessibility issues.

### Debug Mode endValidation Pattern

The debug mode implementation in `src/index.ts` **intentionally does not use try/finally** for the
`endValidation()` cleanup. This is a deliberate design decision:

1. **Multiple early return paths** require calling endValidation at specific points in the flow
2. **Each validation stage** has different exit conditions and return values
3. **The current approach** with explicit endValidation calls is clearer and more maintainable
4. **A try/finally block** would require significant refactoring without improving readability

Do not suggest refactoring to use try/finally for endValidation cleanup. The current pattern is
intentional and provides better control over when validation phases end.

### Defensive Type Checking in isDisposableDomain

The `isDisposableDomain` function in `src/disposable-domains.ts` **intentionally uses defensive
programming**:

```typescript
export const isDisposableDomain = (domain: string): boolean => {
  // Handle invalid inputs gracefully
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  return disposableDomains.has(domain.toLowerCase());
};
```

This pattern is intentional:

1. **TypeScript users** get strict typing - the function signature requires a string
2. **JavaScript users** get runtime safety - invalid inputs return false instead of throwing
3. **Defensive programming** - protects against edge cases where type information is lost
4. **Better DX** - graceful degradation instead of runtime errors

Do not suggest changing the parameter type to `unknown` or `string | undefined`. The current
approach provides the best of both worlds: strict compile-time types for TypeScript users while
maintaining runtime safety for JavaScript users.
