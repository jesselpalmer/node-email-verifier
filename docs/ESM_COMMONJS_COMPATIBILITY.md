# ESM/CommonJS Compatibility Guide

## Overview

The `node-email-verifier` package is designed as an ES Module (ESM) but provides full CommonJS
compatibility through a wrapper mechanism. This document explains the technical implementation and
usage patterns.

## Package Configuration

### Package.json Fields

```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

- **`type: "module"`**: Declares the package as an ESM module
- **`main`**: Points to the ESM entry point for backward compatibility
- **`exports`**: Provides conditional exports for different module systems
  - `import`: Used by ESM imports
  - `require`: Used by CommonJS requires
  - `types`: TypeScript type definitions

## CommonJS Wrapper Implementation

The CommonJS wrapper (`dist/index.cjs`) is automatically generated during the build process:

```javascript
module.exports = (...args) => import('./index.js').then((mod) => mod.default(...args));
```

### How It Works

1. **Dynamic Import**: Uses `import()` to load the ESM module dynamically
2. **Promise-based**: Returns a promise that resolves with the validation result
3. **Argument Forwarding**: Passes all arguments (`...args`) to the underlying ESM function
4. **Default Export Access**: Extracts the default export (`mod.default`)

### Build Process

The wrapper is created by `scripts/build-cjs.js` during the build:

```javascript
// Build script creates the CommonJS wrapper
const cjsWrapper = `module.exports = (...args) => import('./index.js').then(mod => mod.default(...args));\n`;
fs.writeFileSync(path.join(distPath, 'index.cjs'), cjsWrapper);
```

## Usage Patterns

### ES Modules (Recommended)

```javascript
import emailValidator from 'node-email-verifier';

const isValid = await emailValidator('test@example.com');
```

### CommonJS

```javascript
const emailValidator = require('node-email-verifier');

// Note: The function returns a promise
const isValid = await emailValidator('test@example.com');

// Or with .then()
emailValidator('test@example.com')
  .then((isValid) => console.log(isValid))
  .catch((error) => console.error(error));
```

### TypeScript with CommonJS

```typescript
// Import types separately for CommonJS projects
import type { EmailValidatorOptions, ValidationResult } from 'node-email-verifier';

const emailValidator = require('node-email-verifier');

// Full type safety is maintained
async function validate(email: string): Promise<boolean> {
  const options: EmailValidatorOptions = { checkMx: true };
  return await emailValidator(email, options);
}
```

### Dynamic Import in CommonJS

CommonJS files can also use dynamic import for better compatibility:

```javascript
// In a .cjs file
async function validate(email) {
  const { default: emailValidator } = await import('node-email-verifier');
  return emailValidator(email);
}
```

## Important Considerations

### Async Nature

The CommonJS wrapper always returns a Promise, even for synchronous operations:

```javascript
// CommonJS - Always async
const emailValidator = require('node-email-verifier');
const result = await emailValidator('test@example.com'); // Promise

// ESM - Also async (function is inherently async)
import emailValidator from 'node-email-verifier';
const result = await emailValidator('test@example.com'); // Promise
```

### Error Handling

Both module systems handle errors identically:

```javascript
// CommonJS
try {
  const result = await emailValidator('test@example.com', { timeout: '1ms' });
} catch (error) {
  // Handle timeout or other errors
}

// ESM
try {
  const result = await emailValidator('test@example.com', { timeout: '1ms' });
} catch (error) {
  // Same error handling
}
```

### Performance

- **Initial Load**: CommonJS has a slight overhead due to dynamic import
- **Subsequent Calls**: Performance is identical after initial module load
- **Module Caching**: Both systems benefit from Node.js module caching

## Testing

The package includes comprehensive tests for both module systems:

1. **ESM Tests**: `test/import.test.ts` - Tests ESM imports and functionality
2. **CommonJS Tests**: `test/commonjs-test.cjs` - Tests CommonJS require and dynamic import
3. **Wrapper Validation**: Tests verify the CommonJS wrapper content and behavior

## Migration Guide

### From v2.x (CommonJS) to v3.x (ESM)

No code changes required. The package maintains full backward compatibility:

```javascript
// v2.x code continues to work in v3.x
const emailValidator = require('node-email-verifier');
const isValid = await emailValidator('test@example.com');
```

### Best Practices

1. **Use ESM when possible**: Better performance and cleaner syntax
2. **Type imports for CommonJS**: Use `import type` for TypeScript in CommonJS
3. **Handle promises properly**: Always await or use .then() with the validator
4. **Test both systems**: Ensure your integration works with your module system

## Troubleshooting

### Common Issues

1. **"Cannot find module" error**

   - Ensure `exports` field is present in package.json
   - Check Node.js version (requires 18.0.0+)

2. **TypeScript type errors in CommonJS**

   - Use `import type` for type imports
   - Cast results when using `detailed: true`

3. **Promise handling errors**
   - Remember the CommonJS wrapper always returns a Promise
   - Use async/await or .then() for all calls

### Debug Commands

```bash
# Verify the CommonJS wrapper exists
ls -la node_modules/node-email-verifier/dist/index.cjs

# Check the wrapper content
cat node_modules/node-email-verifier/dist/index.cjs

# Test CommonJS compatibility
node -e "const ev = require('node-email-verifier'); ev('test@example.com').then(console.log)"
```
