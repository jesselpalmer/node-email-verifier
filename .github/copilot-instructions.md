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
