#!/usr/bin/env ts-node

/**
 * TypeScript Usage Example
 *
 * This example demonstrates how to use node-email-verifier with TypeScript,
 * including proper type imports and type-safe error handling.
 *
 * To run this example:
 * 1. Install ts-node: npm install -g ts-node
 * 2. Run: ts-node typescript-usage.ts
 */

import emailValidator, {
  EmailValidatorOptions,
  ValidationResult,
  ErrorCode,
  EmailValidationError,
  isEmailValidationError,
} from 'node-email-verifier';

// Type-safe validation function
async function validateEmail(
  email: string,
  options?: EmailValidatorOptions
): Promise<ValidationResult | boolean> {
  return emailValidator(email, options);
}

// Custom type for your application
interface User {
  email: string;
  isValidated: boolean;
  validationError?: string;
}

// Example 1: Basic type-safe usage
async function basicExample(): Promise<void> {
  console.log('=== TypeScript Basic Usage ===\n');

  const email: string = 'user@example.com';
  const isValid: boolean = (await validateEmail(email)) as boolean;

  console.log(`Email: ${email}`);
  console.log(`Valid: ${isValid}\n`);
}

// Example 2: Detailed validation with types
async function detailedExample(): Promise<void> {
  console.log('=== Detailed Validation with Types ===\n');

  const result = (await emailValidator('test@gmail.com', {
    detailed: true,
    checkMx: true,
    checkDisposable: true,
  })) as ValidationResult;

  console.log('Full result:', result);
  console.log('\nType-safe property access:');
  console.log(`Valid: ${result.valid}`);
  console.log(`Reason: ${result.reason}`);

  if (result.validators) {
    console.log(`Format valid: ${result.validators.format?.valid}`);
    console.log(`MX valid: ${result.validators.mx?.valid}`);
    console.log(`Disposable check: ${result.validators.disposable?.valid}`);
  }
}

// Example 3: Error handling with proper types
async function errorHandlingExample(): Promise<void> {
  console.log('\n=== Type-Safe Error Handling ===\n');

  try {
    const result = (await emailValidator('test@nonexistent-domain.com', {
      detailed: true,
      checkMx: true,
      timeout: 3000,
    })) as ValidationResult;

    if (!result.valid && result.errorCode) {
      switch (result.errorCode) {
        case ErrorCode.INVALID_EMAIL_FORMAT:
          console.error('Invalid email format');
          break;
        case ErrorCode.NO_MX_RECORDS:
          console.error('Domain has no MX records');
          break;
        case ErrorCode.DNS_LOOKUP_TIMEOUT:
          console.error('DNS lookup timed out');
          break;
        default:
          console.error(`Validation failed: ${result.errorCode}`);
      }
    }
  } catch (error) {
    if (isEmailValidationError(error)) {
      // Type-safe error handling
      const validationError: EmailValidationError = error;
      console.error(`Validation error: ${validationError.code}`);
      console.error(`Message: ${validationError.message}`);

      if (validationError.originalError) {
        console.error('Original error:', validationError.originalError);
      }
    } else if (error instanceof Error) {
      console.error('Unexpected error:', error.message);
    }
  }
}

// Example 4: Creating a validation service
class EmailValidationService {
  private defaultOptions: EmailValidatorOptions = {
    checkMx: true,
    checkDisposable: true,
    timeout: 5000,
    detailed: true,
  };

  async validateUser(user: User): Promise<void> {
    try {
      const result = (await emailValidator(
        user.email,
        this.defaultOptions
      )) as ValidationResult;

      user.isValidated = result.valid;

      if (!result.valid) {
        user.validationError = result.reason || 'Unknown validation error';
      }
    } catch (error) {
      user.isValidated = false;
      user.validationError = isEmailValidationError(error)
        ? error.message
        : 'Validation failed';
    }
  }

  async validateBatch(
    emails: string[]
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const email of emails) {
      try {
        const result = (await emailValidator(
          email,
          this.defaultOptions
        )) as ValidationResult;
        results.set(email, result);
      } catch (error) {
        // Create a validation result for errors
        results.set(email, {
          valid: false,
          reason: isEmailValidationError(error)
            ? error.message
            : 'Unknown error',
          errorCode: isEmailValidationError(error)
            ? error.code
            : ErrorCode.UNKNOWN_ERROR,
          validators: {},
        });
      }
    }

    return results;
  }
}

// Example 5: Using the validation service
async function serviceExample(): Promise<void> {
  console.log('\n=== Validation Service Example ===\n');

  const service = new EmailValidationService();

  // Validate a single user
  const user: User = {
    email: 'john@example.com',
    isValidated: false,
  };

  await service.validateUser(user);
  console.log('User validation:', user);

  // Validate multiple emails
  const emails = [
    'valid@gmail.com',
    'invalid@fake-domain-12345.com',
    'not-an-email',
  ];

  console.log('\nBatch validation:');
  const results = await service.validateBatch(emails);

  results.forEach((result, email) => {
    console.log(
      `${email}: ${result.valid ? '✅' : '❌'} ${result.reason || ''}`
    );
  });
}

// Run all examples
async function main(): Promise<void> {
  await basicExample();
  await detailedExample();
  await errorHandlingExample();
  await serviceExample();
}

// Execute if running directly
if (require.main === module) {
  main().catch(console.error);
}
