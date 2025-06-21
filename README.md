[![npm](https://img.shields.io/npm/dw/node-email-verifier.svg)](https://www.npmjs.com/package/node-email-verifier)
[![Node.js CI](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/nodejs-ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Install Size](https://packagephobia.com/badge?p=node-email-verifier)](https://packagephobia.com/result?p=node-email-verifier)
[![npm version](https://img.shields.io/npm/v/node-email-verifier.svg)](https://www.npmjs.com/package/node-email-verifier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Node Email Verifier

Node Email Verifier is an email validation library for Node.js that checks if an email address has a
valid format and optionally verifies the domain's MX (Mail Exchange) records to ensure it can
receive emails. It also includes disposable email detection and detailed validation results.

## 🚀 Hosted API Available

**Need email verification without managing servers?** Check out [ValidKit](https://validkit.com) - a
hosted API built on this library with:

- ⚡ Sub-500ms response times
- 🤖 Native AI agent support (ChatGPT, Zapier, MCP)
- 📊 3,000+ disposable domains (vs 600+ in OSS)
- 🔄 Continuous updates & 99.9% uptime
- 🎁 Free tier available (no credit card required)

```bash
# Quick test with ValidKit API
curl -X POST https://api.validkit.com/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vk_beta_test_key_123456789" \
  -d '{"email": "test@example.com"}'
```

[Get your free API key →](https://validkit.com)

## Features

- **RFC 5322 Format Validation**: Validates email addresses against the standard email formatting
  rules.
- **MX Record Checking**: Verifies that the domain of the email address has valid MX records
  indicating that it can receive emails. This check can be disabled using a parameter.
- **Disposable Email Detection**: Identify and optionally block temporary/throwaway email services
  like 10minutemail, guerrillamail, etc.
- **Detailed Validation Results**: Get comprehensive validation information including specific
  failure reasons and validation metadata.
- **Customizable Timeout**: Allows setting a custom timeout for MX record checking.
- **TypeScript Support**: Written in TypeScript with full type definitions for better developer
  experience and IDE support.
- **ES Modules**: Modern ESM support with backward compatibility.
- **Zero Breaking Changes**: All new features are opt-in and maintain full backward compatibility.

## Requirements

- **Node.js**: Version 18.0.0 or higher

## Installation

Install the package using npm:

```bash
npm install node-email-verifier --save
```

## Usage

This package supports both ES modules and CommonJS:

```javascript
// ES Modules (recommended)
import emailValidator from 'node-email-verifier';

// CommonJS
const emailValidator = require('node-email-verifier');
```

Note: When using CommonJS `require()`, the function returns a promise that resolves with the
validation result.

```javascript
// CommonJS usage example
const emailValidator = require('node-email-verifier');

// Since emailValidator returns a promise, handle it with async/await:
(async () => {
  const isValid = await emailValidator('test@example.com');
  console.log('Email is valid:', isValid);
})();

// Or with .then():
emailValidator('test@example.com')
  .then((isValid) => console.log('Email is valid:', isValid))
  .catch((error) => console.error('Validation error:', error));
```

Here's how to use Node Email Verifier in both JavaScript and TypeScript:

### JavaScript

#### ES Modules

```javascript
import emailValidator from 'node-email-verifier';

// Basic validation (format + MX checking)
async function validateEmail(email) {
  try {
    const isValid = await emailValidator(email);
    console.log(`Is "${email}" valid?`, isValid);
  } catch (error) {
    console.error('Validation error:', error);
  }
}
```

#### CommonJS

```javascript
const emailValidator = require('node-email-verifier');

// Basic validation (format + MX checking)
async function validateEmail(email) {
  try {
    const isValid = await emailValidator(email);
    console.log(`Is "${email}" valid?`, isValid);
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Disposable email detection
async function validateWithDisposableCheck(email) {
  try {
    const isValid = await emailValidator(email, {
      checkDisposable: true,
    });
    console.log(`Is "${email}" valid (blocking disposable)?`, isValid);
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Detailed validation results
async function getDetailedValidation(email) {
  try {
    const result = await emailValidator(email, {
      detailed: true,
      checkDisposable: true,
    });
    console.log('Detailed validation result:', result);
    /*
    Example output:
    {
      valid: false,
      email: 'test@10minutemail.com',
      format: { valid: true },
      mx: { valid: true, records: [...] },
      disposable: { 
        valid: false, 
        provider: '10minutemail.com',
        reason: 'Email from disposable provider'
      }
    }
    */
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Custom timeout and advanced options
async function validateWithCustomOptions(email) {
  try {
    const isValid = await emailValidator(email, {
      checkMx: true,
      checkDisposable: true,
      timeout: '500ms', // or timeout: 500 for milliseconds
    });
    console.log(`Is "${email}" valid with all checks?`, isValid);
  } catch (error) {
    if (error.message === 'DNS lookup timed out') {
      console.error('Timeout on DNS lookup.');
    } else {
      console.error('Validation error:', error);
    }
  }
}

// Format-only validation (fastest)
async function validateFormatOnly(email) {
  try {
    const isValid = await emailValidator(email, { checkMx: false });
    console.log(`Is "${email}" format valid?`, isValid);
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Usage examples
validateEmail('test@example.com');
validateWithDisposableCheck('test@10minutemail.com'); // → false
getDetailedValidation('invalid-email'); // → detailed error info
validateFormatOnly('test@example.com'); // → true (no MX check)
```

### TypeScript

#### ES Modules

```typescript
import emailValidator, { EmailValidatorOptions, ValidationResult } from 'node-email-verifier';

// Basic validation with typed options
async function validateEmailTyped(email: string): Promise<boolean> {
  const options: EmailValidatorOptions = {
    checkMx: true,
    checkDisposable: true,
    timeout: '5s',
  };

  try {
    const isValid = await emailValidator(email, options);
    console.log(`Is "${email}" valid?`, isValid);
    return isValid;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Detailed validation with typed results
async function getDetailedValidationTyped(email: string): Promise<ValidationResult> {
  const result = (await emailValidator(email, {
    detailed: true,
    checkMx: true,
    checkDisposable: true,
  })) as ValidationResult;

  // TypeScript knows the exact structure
  if (!result.valid) {
    console.log('Validation failed:');

    if (!result.format.valid) {
      console.log('- Format issue:', result.format.reason);
    }

    if (result.disposable && !result.disposable.valid) {
      console.log('- Disposable email from:', result.disposable.provider);
    }

    if (result.mx && !result.mx.valid) {
      console.log('- MX issue:', result.mx.reason);
    }
  }

  return result;
}

// Type-safe inline validation
async function quickValidation(email: string): Promise<boolean> {
  const result = await emailValidator(email, {
    checkMx: false,
    checkDisposable: true, // Block disposable emails
    timeout: 2000,
  });
  return result as boolean;
}

// Create specialized validators
function createValidator(options: EmailValidatorOptions) {
  return (email: string) => emailValidator(email, options);
}

const fastValidator = createValidator({
  checkMx: false,
  checkDisposable: false,
});

const businessValidator = createValidator({
  checkMx: true,
  checkDisposable: true,
  timeout: '10s',
});

const detailedValidator = createValidator({
  detailed: true,
  checkMx: true,
  checkDisposable: true,
});
```

#### CommonJS

When using CommonJS with TypeScript, you can still get full type support:

```typescript
// For CommonJS projects, use require with type imports
import type { EmailValidatorOptions, ValidationResult } from 'node-email-verifier';

const emailValidator = require('node-email-verifier');

// Basic validation with typed options
async function validateEmailCJS(email: string): Promise<boolean> {
  const options: EmailValidatorOptions = {
    checkMx: true,
    checkDisposable: true,
    timeout: '5s',
  };

  try {
    const isValid = await emailValidator(email, options);
    console.log(`Is "${email}" valid?`, isValid);
    return isValid;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Detailed validation with typed results
async function getDetailedValidationCJS(email: string): Promise<ValidationResult> {
  const result = (await emailValidator(email, {
    detailed: true,
    checkMx: true,
    checkDisposable: true,
  })) as ValidationResult;

  // TypeScript still knows the exact structure
  if (!result.valid) {
    console.log('Validation failed:');

    if (!result.format.valid) {
      console.log('- Format issue:', result.format.reason);
    }

    if (result.disposable && !result.disposable.valid) {
      console.log('- Disposable email from:', result.disposable.provider);
    }

    if (result.mx && !result.mx.valid) {
      console.log('- MX issue:', result.mx.reason);
    }
  }

  return result;
}

// Alternative: Use dynamic import in CommonJS for full type inference
async function validateWithDynamicImport(email: string): Promise<boolean> {
  const { default: emailValidator } = await import('node-email-verifier');

  return emailValidator(email, {
    checkMx: true,
    checkDisposable: true,
  });
}
```

## New Features (v3.1.0)

### Disposable Email Detection

Block temporary and throwaway email services to improve data quality:

```javascript
// Block disposable emails
const isValid = await emailValidator('test@10minutemail.com', {
  checkDisposable: true,
}); // → false

// Allow disposable emails (default behavior)
const isValid = await emailValidator('test@10minutemail.com', {
  checkDisposable: false,
}); // → true (if format and MX are valid)
```

**Supported disposable providers**: 600+ domains including 10minutemail, guerrillamail, yopmail,
tempmail, mailinator, and many more.

### Detailed Validation Results

Get comprehensive validation information with specific failure reasons:

```javascript
// Get detailed validation results
const result = await emailValidator('test@10minutemail.com', {
  detailed: true,
  checkMx: true,
  checkDisposable: true,
});

console.log(result);
/*
Output:
{
  "valid": false,
  "email": "test@10minutemail.com",
  "format": { "valid": true },
  "mx": { 
    "valid": true, 
    "records": [{"exchange": "mx.10minutemail.com", "priority": 10}] 
  },
  "disposable": { 
    "valid": false, 
    "provider": "10minutemail.com",
    "reason": "Email from disposable provider" 
  }
}
*/

// Handle validation results
if (!result.valid) {
  if (!result.format.valid) {
    console.log('Invalid email format:', result.format.reason);
  }

  if (result.disposable && !result.disposable.valid) {
    console.log('Disposable email detected:', result.disposable.provider);
  }

  if (result.mx && !result.mx.valid) {
    console.log('MX validation failed:', result.mx.reason);
  }
}
```

### Combining Features

```javascript
// Use all features together
const result = await emailValidator(email, {
  checkMx: true, // Verify MX records
  checkDisposable: true, // Block disposable emails
  detailed: true, // Get detailed results
  timeout: '5s', // Custom timeout
});

// Business-friendly validation
const isBusinessEmail = await emailValidator(email, {
  checkMx: true,
  checkDisposable: true, // Block temporary emails
  timeout: '10s',
}); // Returns boolean for simple usage
```

### Error Codes (v3.2.0+)

Detailed validation results now include error codes for programmatic error handling:

```javascript
const result = await emailValidator('invalid-email', {
  detailed: true,
  checkMx: true,
  checkDisposable: true,
});

// Check specific error codes
if (!result.valid) {
  switch (result.format.errorCode) {
    case 'INVALID_INPUT_TYPE':
      console.log('Email must be a string');
      break;
    case 'EMAIL_EMPTY':
      console.log('Email cannot be empty');
      break;
    case 'INVALID_EMAIL_FORMAT':
      console.log('Invalid email format');
      break;
  }

  if (result.mx?.errorCode) {
    switch (result.mx.errorCode) {
      case 'NO_MX_RECORDS':
        console.log('No mail server found');
        break;
      case 'DNS_LOOKUP_FAILED':
        console.log('DNS lookup error');
        break;
      case 'DNS_LOOKUP_TIMEOUT':
        console.log('DNS lookup timed out');
        break;
      case 'MX_SKIPPED_DISPOSABLE':
        console.log('MX check skipped due to disposable email');
        break;
    }
  }

  if (result.disposable?.errorCode === 'DISPOSABLE_EMAIL') {
    console.log('Disposable email detected');
  }
}
```

**Available Error Codes:**

- `INVALID_INPUT_TYPE` - Email is not a string
- `EMAIL_EMPTY` - Email string is empty
- `INVALID_EMAIL_FORMAT` - Email format is invalid
- `NO_MX_RECORDS` - No MX records found for domain
- `DNS_LOOKUP_FAILED` - DNS lookup encountered an error
- `DNS_LOOKUP_TIMEOUT` - DNS lookup exceeded timeout
- `MX_SKIPPED_DISPOSABLE` - MX check was skipped because email is disposable
- `DISPOSABLE_EMAIL` - Email is from a disposable provider
- `INVALID_TIMEOUT_VALUE` - Invalid timeout parameter
- `UNKNOWN_ERROR` - An unknown error occurred

## Package Configuration

This package supports both ES modules and CommonJS through the `exports` field in `package.json`.
Key configuration details:

- **`"type": "module"`**: Designates this as an ES module package
- **`"main"`**: Points to `./dist/index.js` for legacy compatibility
- **`"types"`**: TypeScript definitions at `./dist/index.d.ts` for both module systems
- **`"exports"`**: Modern Node.js module resolution with conditional exports:
  - `"import"`: ES module entry point (`./dist/index.js`)
  - `"require"`: CommonJS entry point (`./dist/index.cjs`)
  - `"types"`: Shared TypeScript definitions (`./dist/index.d.ts`)
- **Node Version**: Requires Node.js 18.0.0 or higher
- **Build Process**: TypeScript compilation + automatic CommonJS wrapper generation

For the complete configuration, see the [package.json](./package.json) file.

This configuration ensures the package works correctly with:

- `import emailValidator from 'node-email-verifier'` (ES modules)
- `const emailValidator = require('node-email-verifier')` (CommonJS)
- TypeScript projects using either module system
- Bundlers like webpack, Rollup, and Vite
- Modern Node.js versions (18+) with proper module resolution

## API

### `emailValidator(email, [opts]): Promise<boolean | ValidationResult>`

Validates the given email address with comprehensive validation options including format checking,
MX record verification, disposable email detection, and detailed results.

#### Handling Return Types

```js
// Type-safe handling of both return types
async function handleValidation(email) {
  const result = await emailValidator(email, {
    checkDisposable: true,
    detailed: true  // This determines the return type
  });

  // When detailed: true, result is ValidationResult
  if (typeof result === 'object') {
    console.log('Detailed validation:');
    console.log('Valid:', result.valid);

    if (!result.valid) {
      if (!result.format.valid) {
        console.log('Format error:', result.format.reason);
      }

      if (result.disposable && !result.disposable.valid) {
        console.log('Disposable provider:', result.disposable.provider);
      }
    }

    return result.valid;
  }

  // When detailed: false (default), result is boolean
  console.log('Simple validation:', result);
  return result;
}

// Or use TypeScript for compile-time safety
const detailedResult = await emailValidator(email, { detailed: true }) as ValidationResult;
const booleanResult = await emailValidator(email, { detailed: false }) as boolean;
```

#### Parameters

- **`email`** (`unknown`): The email address to validate. Can be any type, but only strings will be
  considered valid.
- **`opts`** (`EmailValidatorOptions | boolean`, optional): Configuration options or a boolean for
  backward compatibility.

#### Options (`EmailValidatorOptions`)

```typescript
interface EmailValidatorOptions {
  checkMx?: boolean; // Whether to check for MX records (default: true)
  checkDisposable?: boolean; // Whether to check for disposable emails (default: false)
  detailed?: boolean; // Return detailed validation results (default: false)
  timeout?: string | number; // Timeout for DNS lookup (default: '10s')
}

// See "Type Definitions" section below for ValidationResult interface
```

- **`checkMx`** (`boolean`, optional): Whether to check for MX records. Defaults to `true`.
- **`checkDisposable`** (`boolean`, optional): Whether to check for disposable email providers.
  Defaults to `false`.
- **`detailed`** (`boolean`, optional): Return detailed validation results instead of boolean.
  Defaults to `false`.
- **`timeout`** (`string | number`, optional): The timeout for the DNS MX lookup. Can be:
  - A number in milliseconds (e.g., `5000`)
  - A string in ms format (e.g., `'5s'`, `'2000ms'`, `'1m'`)
  - Defaults to `'10s'` (10 seconds)

#### Backward Compatibility

For backward compatibility, you can also pass a boolean as the second parameter:

- `true`: Enable MX checking (equivalent to `{ checkMx: true }`)
- `false`: Disable MX checking (equivalent to `{ checkMx: false }`)

#### Returns

**`Promise<boolean | ValidationResult>`**: A promise that resolves to:

- `boolean` (when `detailed: false` or not specified):
  - `true` if the email address passes all enabled validations
  - `false` if the email address fails any enabled validation
- `ValidationResult` (when `detailed: true`):
  - Comprehensive validation information including specific failure reasons
  - Always includes `format` validation results
  - Includes `mx` results only when `checkMx: true`
  - Includes `disposable` results only when `checkDisposable: true`

#### Throws

- **`Error`**: When DNS lookup times out, the error message will be "DNS lookup timed out"

## TypeScript Benefits

This library is written in TypeScript and provides several benefits for TypeScript users:

- **Type Safety**: Full type checking for all parameters and return values
- **IntelliSense**: Rich autocomplete and documentation in your IDE
- **Interface Exports**: Import and use the `EmailValidatorOptions` interface in your own code
- **Compile-time Error Detection**: Catch mistakes before runtime

### Type Definitions

The library exports the following types:

```typescript
// Main function type
declare function emailValidator(
  email: unknown,
  opts?: EmailValidatorOptions | boolean
): Promise<boolean | ValidationResult>;

// Options interface
export interface EmailValidatorOptions {
  checkMx?: boolean;
  checkDisposable?: boolean;
  detailed?: boolean;
  timeout?: string | number;
}

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  email: string;
  format: {
    valid: boolean;
    reason?: string;
    errorCode?: ErrorCode;
  };
  mx?: {
    valid: boolean;
    records?: MxRecord[];
    reason?: string;
    errorCode?: ErrorCode;
  };
  disposable?: {
    valid: boolean;
    provider?: string | null;
    reason?: string;
    errorCode?: ErrorCode;
  };
}

// Error code enum (v3.2.0+)
export enum ErrorCode {
  INVALID_INPUT_TYPE = 'INVALID_INPUT_TYPE',
  EMAIL_EMPTY = 'EMAIL_EMPTY',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  NO_MX_RECORDS = 'NO_MX_RECORDS',
  DNS_LOOKUP_FAILED = 'DNS_LOOKUP_FAILED',
  DNS_LOOKUP_TIMEOUT = 'DNS_LOOKUP_TIMEOUT',
  MX_SKIPPED_DISPOSABLE = 'MX_SKIPPED_DISPOSABLE',
  DISPOSABLE_EMAIL = 'DISPOSABLE_EMAIL',
  INVALID_TIMEOUT_VALUE = 'INVALID_TIMEOUT_VALUE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

## Production Usage

When using this library in production environments, especially with MX record checking enabled, it's
important to consider DNS rate limiting. For detailed guidance on:

- Implementing request throttling
- Adding retry logic with exponential backoff
- Caching MX records
- Monitoring DNS failures

See our [API Best Practices Guide](docs/API_BEST_PRACTICES.md).

## Development

### Available Scripts

- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run test`** - Run the test suite
- **`npm run lint`** - Check JavaScript/TypeScript code for linting issues
- **`npm run lint:fix`** - Automatically fix JavaScript/TypeScript linting issues
- **`npm run lint:md`** - Check Markdown files for linting issues
- **`npm run lint:md:fix`** - Automatically fix Markdown linting issues
- **`npm run lint:yaml`** - Check YAML files for validity
- **`npm run lint:all`** - Run all linters (JS/TS, Markdown, YAML)
- **`npm run format`** - Format code with Prettier
- **`npm run format:check`** - Check if code is properly formatted
- **`npm run check`** - Run all linting, formatting, and tests
- **`npm run precommit`** - Fix linting, format code, and run tests
- **`npm run benchmark`** - Run performance benchmarks for disposable domain lookups
- **`npm run benchmark:init`** - Run initialization and memory usage benchmarks
- **`npm run benchmark:all`** - Run all benchmarks

### Code Quality

This project uses:

- **ESLint** for JavaScript/TypeScript linting
- **Markdownlint** for Markdown file linting
- **yaml-lint** for YAML file validation
- **Prettier** for code formatting (JS/TS, JSON, Markdown, YAML)
- **Jest** for testing with TypeScript integration

Before committing, run `npm run precommit` to ensure code quality.

### Git Hooks

This project uses [husky](https://typicode.github.io/husky/) and
[lint-staged](https://github.com/okonet/lint-staged) to maintain code quality:

- **Pre-commit**: Automatically fixes linting issues and formats staged files
- **Pre-push**: Runs the full test suite to prevent pushing broken code

These hooks are installed automatically when you run `npm install`.

## Project Structure

```text
node-email-verifier/
├── src/              # Source TypeScript files
├── dist/             # Built JavaScript files and CommonJS wrapper
├── test/             # Test files (unit and integration tests)
├── scripts/          # Build scripts and performance benchmarks
├── docs/             # Additional documentation
│   ├── AI_WORKFLOW.md                    # AI-assisted PR workflow guide
│   ├── API_BEST_PRACTICES.md            # Rate limiting and production usage
│   ├── ESM_COMMONJS_COMPATIBILITY.md    # Module compatibility guide
│   ├── INTEGRATION_TESTING.md           # Integration testing guide
│   └── PERFORMANCE.md                   # Performance benchmarks and analysis
└── examples/         # (Coming soon) Example usage scripts
```

## Contributing

Contributions are always welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed
information about:

- Development setup
- Code quality standards
- Available npm scripts
- Testing guidelines
- Commit message format

Quick start:

```bash
npm install
npm run check  # Run all quality checks
```

Feel free to submit a PR!

## License

This project is licensed under the MIT License.
