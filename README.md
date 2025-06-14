[![npm](https://img.shields.io/npm/dw/node-email-verifier.svg)](https://www.npmjs.com/package/node-email-verifier)
[![Node.js CI](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/nodejs-ci..yml/badge.svg)](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/nodejs-ci..yml)

# Node Email Verifier

Node Email Verifier is an email validation library for Node.js that checks if an
email address has a valid format and optionally verifies the domain's MX
(Mail Exchange) records to ensure it can receive emails.

## Features

- **RFC 5322 Format Validation**: Validates email addresses against the standard
  email formatting rules.
- **MX Record Checking**: Verifies that the domain of the email address has
  valid MX records indicating that it can receive emails. This check can be
  disabled using a parameter.
- **Customizable Timeout**: Allows setting a custom timeout for MX record
  checking.
- **TypeScript Support**: Written in TypeScript with full type definitions for
  better developer experience and IDE support.
- **ES Modules**: Modern ESM support with backward compatibility.

## Installation

Install the package using npm:

```bash
npm install node-email-verifier --save
```

## Usage

Here's how to use Node Email Verifier in both JavaScript and TypeScript:

### JavaScript

```javascript
import emailValidator from 'node-email-verifier';

// Example with MX record checking
async function validateEmailWithMx(email) {
  try {
    const isValid = await emailValidator(email, { checkMx: true });
    console.log(
      `Is "${email}" a valid email address with MX checking?`,
      isValid
    );
  } catch (error) {
    console.error('Error validating email with MX checking:', error);
  }
}

// Example with MX record checking and custom timeout
async function validateEmailWithMxTimeout(email) {
  try {
    const isValid = await emailValidator(email, {
      checkMx: true,
      timeout: '500ms',
    });
    console.log(
      `Is "${email}" a valid email address with MX checking and custom timeout?`,
      isValid
    );
  } catch (error) {
    if (error.message.match(/timed out/)) {
      console.error('Timeout on DNS MX lookup.');
    } else {
      console.error('Error validating email with MX checking:', error);
    }
  }
}

// Example with custom timeout as a number
async function validateEmailWithMxTimeoutNumber(email) {
  try {
    const isValid = await emailValidator(email, {
      checkMx: true,
      timeout: 500,
    });
    console.log(
      `Is "${email}" a valid email address with MX checking and custom timeout?`,
      isValid
    );
  } catch (error) {
    if (error.message.match(/timed out/)) {
      console.error('Timeout on DNS MX lookup.');
    } else {
      console.error('Error validating email with MX checking:', error);
    }
  }
}

// Example without MX record checking
async function validateEmailWithoutMx(email) {
  try {
    const isValid = await emailValidator(email, { checkMx: false });
    console.log(
      `Is "${email}" a valid email address without MX checking?`,
      isValid
    );
  } catch (error) {
    console.error('Error validating email without MX checking:', error);
  }
}

validateEmailWithMx('test@example.com').then();
validateEmailWithMxTimeout('test@example.com').then();
validateEmailWithMxTimeoutNumber('test@example.com').then();
validateEmailWithoutMx('test@example.com').then();
```

### TypeScript

```typescript
import emailValidator, { EmailValidatorOptions } from 'node-email-verifier';

// Example with typed options
async function validateEmailTyped(email: string): Promise<boolean> {
  const options: EmailValidatorOptions = {
    checkMx: true,
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

// Example with inline options (also typed)
async function quickValidation(email: string): Promise<boolean> {
  return emailValidator(email, {
    checkMx: false,
    timeout: 2000,
  });
}

// Example function that accepts options parameter
function createValidator(options: EmailValidatorOptions) {
  return (email: string) => emailValidator(email, options);
}

const fastValidator = createValidator({ checkMx: false });
const thoroughValidator = createValidator({ checkMx: true, timeout: '30s' });
```

## API

### `emailValidator(email, [opts]): Promise<boolean>`

Validates the given email address, with an option to skip MX record verification
and set a custom timeout.

#### Parameters

- **`email`** (`unknown`): The email address to validate. Can be any type, but only strings will be considered valid.
- **`opts`** (`EmailValidatorOptions | boolean`, optional): Configuration options or a boolean for backward compatibility.

#### Options (`EmailValidatorOptions`)

```typescript
interface EmailValidatorOptions {
  checkMx?: boolean; // Whether to check for MX records (default: true)
  timeout?: string | number; // Timeout for DNS lookup (default: '10s')
}
```

- **`checkMx`** (`boolean`, optional): Whether to check for MX records. Defaults to `true`.
- **`timeout`** (`string | number`, optional): The timeout for the DNS MX lookup. Can be:
  - A number in milliseconds (e.g., `5000`)
  - A string in ms format (e.g., `'5s'`, `'2000ms'`, `'1m'`)
  - Defaults to `'10s'` (10 seconds)

#### Backward Compatibility

For backward compatibility, you can also pass a boolean as the second parameter:

- `true`: Enable MX checking (equivalent to `{ checkMx: true }`)
- `false`: Disable MX checking (equivalent to `{ checkMx: false }`)

#### Returns

**`Promise<boolean>`**: A promise that resolves to:

- `true` if the email address is valid and (if MX checking is enabled) has valid MX records
- `false` if the email address is invalid or doesn't have MX records

#### Throws

- **`Error`**: When DNS MX lookup times out, the error message will contain "timed out"

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
): Promise<boolean>;

// Options interface
export interface EmailValidatorOptions {
  checkMx?: boolean;
  timeout?: string | number;
}
```

## Development

### Available Scripts

- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run test`** - Run the test suite
- **`npm run lint`** - Check code for linting issues
- **`npm run lint:fix`** - Automatically fix linting issues
- **`npm run format`** - Format code with Prettier
- **`npm run format:check`** - Check if code is properly formatted
- **`npm run check`** - Run linting, formatting, and tests
- **`npm run precommit`** - Fix linting, format code, and run tests

### Code Quality

This project uses:

- **ESLint** for code linting with TypeScript support
- **Prettier** for code formatting
- **Jest** for testing with TypeScript integration

Before committing, run `npm run precommit` to ensure code quality.

## Contributing

Contributions are always welcome! Please ensure:

1. Code passes all tests: `npm test`
2. Code passes linting: `npm run lint`
3. Code is properly formatted: `npm run format`
4. Or simply run: `npm run check`

Feel free to submit a PR!

## License

This project is licensed under the MIT License.
