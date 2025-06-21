#!/usr/bin/env node

/**
 * Error Handling Example
 *
 * This example demonstrates comprehensive error handling with node-email-verifier,
 * including the new error code system introduced in v3.2.0.
 */

import emailValidator, {
  ErrorCode,
  isEmailValidationError,
} from 'node-email-verifier';

// Example 1: Basic error handling
async function basicErrorHandling() {
  console.log('=== Basic Error Handling ===\n');

  const testCases = [
    { email: null, description: 'Null email' },
    { email: '', description: 'Empty string' },
    { email: 'invalid-format', description: 'Invalid format' },
    {
      email: 'test@nonexistent-domain-xyz.com',
      description: 'Non-existent domain',
    },
    { email: 'test@tempmail.com', description: 'Disposable email' },
  ];

  for (const { email, description } of testCases) {
    console.log(`Testing: ${description}`);
    try {
      const result = await emailValidator(email, {
        checkMx: true,
        checkDisposable: true,
      });
      console.log(`Result: ${result ? '✅ Valid' : '❌ Invalid'}\n`);
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
  }
}

// Example 2: Using error codes for specific handling
async function errorCodeHandling() {
  console.log('=== Error Code Handling ===\n');

  async function validateWithErrorHandling(email) {
    try {
      const result = await emailValidator(email, {
        detailed: true,
        checkMx: true,
        checkDisposable: true,
        timeout: 3000,
      });

      if (!result.valid) {
        switch (result.errorCode) {
          case ErrorCode.EMAIL_MUST_BE_STRING:
            console.error('❌ Input must be a string');
            break;

          case ErrorCode.EMAIL_CANNOT_BE_EMPTY:
            console.error('❌ Email cannot be empty');
            break;

          case ErrorCode.INVALID_EMAIL_FORMAT:
            console.error('❌ Invalid email format');
            console.error('   Please use format: user@domain.com');
            break;

          case ErrorCode.NO_MX_RECORDS:
            console.error('❌ Domain has no mail servers');
            console.error('   The domain cannot receive emails');
            break;

          case ErrorCode.DNS_LOOKUP_FAILED:
            console.error('❌ Could not verify domain');
            console.error('   Domain might not exist');
            break;

          case ErrorCode.DNS_LOOKUP_TIMEOUT:
            console.error('❌ Domain verification timed out');
            console.error('   Try again later');
            break;

          case ErrorCode.DISPOSABLE_EMAIL:
            console.error('❌ Disposable email detected');
            console.error('   Please use a permanent email address');
            break;

          case ErrorCode.MX_SKIPPED_DISPOSABLE:
            console.error('❌ Email from temporary service');
            console.error('   MX check was skipped');
            break;

          default:
            console.error(`❌ Validation failed: ${result.errorCode}`);
        }
      } else {
        console.log('✅ Email is valid');
      }
    } catch (error) {
      if (isEmailValidationError(error)) {
        console.error(`❌ Validation error: ${error.code}`);
        console.error(`   Message: ${error.message}`);
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
  }

  // Test various error scenarios
  const testEmails = [
    'valid@gmail.com',
    '',
    'invalid-format',
    'test@fake-domain-12345.com',
    'user@10minutemail.com',
  ];

  for (const email of testEmails) {
    console.log(`\nValidating: "${email}"`);
    await validateWithErrorHandling(email);
  }
}

// Example 3: Timeout handling
async function timeoutHandling() {
  console.log('\n=== Timeout Handling ===\n');

  const email = 'test@example.com';
  const timeouts = [1, 100, 1000, 5000]; // milliseconds

  for (const timeout of timeouts) {
    console.log(`Testing with ${timeout}ms timeout:`);
    try {
      const result = await emailValidator(email, {
        checkMx: true,
        timeout,
        detailed: true,
      });

      if (result.valid) {
        console.log('✅ Validation completed successfully');
      } else {
        console.log(`❌ Validation failed: ${result.errorCode}`);
      }
    } catch (error) {
      if (
        isEmailValidationError(error) &&
        error.code === ErrorCode.DNS_LOOKUP_TIMEOUT
      ) {
        console.log('❌ Timeout occurred - DNS lookup took too long');
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    console.log('');
  }
}

// Example 4: Custom error handler class
class EmailValidationHandler {
  constructor() {
    this.errorMessages = {
      [ErrorCode.EMAIL_MUST_BE_STRING]: 'Please provide a valid email address',
      [ErrorCode.EMAIL_CANNOT_BE_EMPTY]: 'Email address is required',
      [ErrorCode.INVALID_EMAIL_FORMAT]: 'Please check your email format',
      [ErrorCode.NO_MX_RECORDS]: 'This domain cannot receive emails',
      [ErrorCode.DNS_LOOKUP_FAILED]: 'Could not verify this email domain',
      [ErrorCode.DNS_LOOKUP_TIMEOUT]:
        'Verification is taking too long, please try again',
      [ErrorCode.DISPOSABLE_EMAIL]: 'Please use your permanent email address',
      [ErrorCode.INVALID_TIMEOUT_VALUE]: 'Invalid timeout configuration',
      [ErrorCode.UNKNOWN_ERROR]: 'Something went wrong, please try again',
    };
  }

  async validate(email, options = {}) {
    const result = {
      success: false,
      email,
      message: '',
      errorCode: null,
      details: null,
    };

    try {
      const validation = await emailValidator(email, {
        detailed: true,
        ...options,
      });

      if (validation.valid) {
        result.success = true;
        result.message = 'Email is valid';
      } else {
        result.errorCode = validation.errorCode;
        result.message = this.getUserFriendlyMessage(validation.errorCode);
        result.details = validation;
      }
    } catch (error) {
      if (isEmailValidationError(error)) {
        result.errorCode = error.code;
        result.message = this.getUserFriendlyMessage(error.code);
      } else {
        result.errorCode = ErrorCode.UNKNOWN_ERROR;
        result.message = this.errorMessages[ErrorCode.UNKNOWN_ERROR];
      }
    }

    return result;
  }

  getUserFriendlyMessage(errorCode) {
    return this.errorMessages[errorCode] || 'Email validation failed';
  }

  // Retry logic for timeout errors
  async validateWithRetry(email, options = {}, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}...`);
        const result = await this.validate(email, options);

        if (
          result.success ||
          result.errorCode !== ErrorCode.DNS_LOOKUP_TIMEOUT
        ) {
          return result;
        }

        lastError = result;

        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error;
      }
    }

    return lastError;
  }
}

// Example 5: Using the custom handler
async function customHandlerExample() {
  console.log('\n=== Custom Error Handler Example ===\n');

  const handler = new EmailValidationHandler();

  // Test various scenarios
  const testCases = [
    { email: 'user@gmail.com', options: { checkMx: true } },
    { email: '', options: {} },
    { email: 'bad-format', options: {} },
    { email: 'test@disposable-email.com', options: { checkDisposable: true } },
    { email: 'slow@example.com', options: { checkMx: true, timeout: 1 } },
  ];

  for (const { email, options } of testCases) {
    console.log(`\nValidating: "${email}"`);
    const result = await handler.validate(email, options);

    console.log(`Status: ${result.success ? '✅' : '❌'}`);
    console.log(`Message: ${result.message}`);
    if (result.errorCode) {
      console.log(`Error Code: ${result.errorCode}`);
    }
  }

  // Test retry logic
  console.log('\n\nTesting retry logic for timeout:');
  const retryResult = await handler.validateWithRetry(
    'test@example.com',
    { checkMx: true, timeout: 1 },
    3
  );
  console.log('Final result:', retryResult);
}

// Example 6: Integration with Express error handling (conceptual)
function expressErrorHandlerExample() {
  console.log('\n=== Express Integration Example (Conceptual) ===\n');

  // This is a conceptual example showing how you might integrate
  // error handling in an Express application

  const exampleCode = `
// In your Express route:
app.post('/api/register', async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await emailValidator(email, {
      detailed: true,
      checkMx: true,
      checkDisposable: true
    });

    if (!result.valid) {
      return res.status(400).json({
        error: 'Invalid email',
        code: result.errorCode,
        message: getErrorMessage(result.errorCode)
      });
    }

    // Continue with registration...
    
  } catch (error) {
    if (isEmailValidationError(error)) {
      return res.status(400).json({
        error: 'Email validation failed',
        code: error.code,
        message: error.message
      });
    }
    
    // Log unexpected errors
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});`;

  console.log('Example Express error handling:');
  console.log(exampleCode);
}

// Main execution
async function main() {
  await basicErrorHandling();
  await errorCodeHandling();
  await timeoutHandling();
  await customHandlerExample();
  expressErrorHandlerExample();
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
