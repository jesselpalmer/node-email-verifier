#!/usr/bin/env node

/**
 * CommonJS Usage Example
 *
 * This example demonstrates how to use node-email-verifier in CommonJS environments.
 * The library provides a CommonJS wrapper for compatibility with older Node.js projects.
 */

// CommonJS require
const emailValidator = require('node-email-verifier');

// Extract error utilities (available in v3.2.0+)
const { ErrorCode, isEmailValidationError } = emailValidator;

// Example 1: Basic CommonJS usage with promises
async function basicExample() {
  console.log('=== CommonJS Basic Usage ===\n');

  try {
    const isValid = await emailValidator('user@example.com');
    console.log('Email is valid:', isValid);
  } catch (error) {
    console.error('Validation error:', error.message);
  }
}

// Example 2: Using .then() syntax (traditional promises)
function promiseExample() {
  console.log('\n=== Promise Chain Example ===\n');

  emailValidator('test@gmail.com', { checkMx: true })
    .then((result) => {
      console.log('Validation result:', result);
    })
    .catch((error) => {
      console.error('Error:', error.message);
    });
}

// Example 3: Callback wrapper for legacy code
function validateEmailCallback(email, options, callback) {
  // If no callback provided, assume options is the callback
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  emailValidator(email, options)
    .then((result) => callback(null, result))
    .catch((error) => callback(error));
}

// Using the callback wrapper
function callbackExample() {
  console.log('\n=== Callback Style Example ===\n');

  validateEmailCallback(
    'user@example.com',
    { checkMx: true },
    (err, result) => {
      if (err) {
        console.error('Callback error:', err.message);
      } else {
        console.log('Callback result:', result);
      }
    }
  );
}

// Example 4: Detailed validation in CommonJS
async function detailedExample() {
  console.log('\n=== Detailed Validation in CommonJS ===\n');

  try {
    const result = await emailValidator('test@disposable.com', {
      detailed: true,
      checkMx: true,
      checkDisposable: true,
    });

    console.log('Full result:', JSON.stringify(result, null, 2));

    if (!result.valid) {
      console.log('\nValidation failed:');
      console.log('Reason:', result.reason);
      console.log('Error code:', result.errorCode);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 5: Batch processing with CommonJS
async function batchProcessing() {
  console.log('\n=== Batch Processing Example ===\n');

  const emails = [
    'valid@gmail.com',
    'invalid-email',
    'test@tempmail.com',
    'user@company.org',
  ];

  const results = [];

  // Process emails sequentially
  for (const email of emails) {
    try {
      const result = await emailValidator(email, {
        detailed: true,
        checkMx: true,
        checkDisposable: true,
      });

      results.push({
        email,
        valid: result.valid,
        reason: result.reason || 'Valid',
      });
    } catch (error) {
      results.push({
        email,
        valid: false,
        reason: error.message,
      });
    }
  }

  // Display results
  console.table(results);
}

// Example 6: Error handling with error codes
async function errorHandlingExample() {
  console.log('\n=== Error Code Handling in CommonJS ===\n');

  const testEmails = [
    null,
    '',
    'invalid@format',
    'test@nonexistent-domain.xyz',
  ];

  for (const email of testEmails) {
    try {
      const result = await emailValidator(email, {
        detailed: true,
        checkMx: true,
      });

      if (!result.valid) {
        switch (result.errorCode) {
          case ErrorCode.EMAIL_MUST_BE_STRING:
            console.log(`"${email}" - Error: Must be a string`);
            break;
          case ErrorCode.EMAIL_CANNOT_BE_EMPTY:
            console.log(`"${email}" - Error: Cannot be empty`);
            break;
          case ErrorCode.INVALID_EMAIL_FORMAT:
            console.log(`"${email}" - Error: Invalid format`);
            break;
          case ErrorCode.NO_MX_RECORDS:
            console.log(`"${email}" - Error: No MX records`);
            break;
          default:
            console.log(`"${email}" - Error: ${result.errorCode}`);
        }
      }
    } catch (error) {
      if (isEmailValidationError(error)) {
        console.log(`"${email}" - Validation error: ${error.code}`);
      } else {
        console.log(`"${email}" - Unexpected error: ${error.message}`);
      }
    }
  }
}

// Example 7: Integration with older frameworks
function expressMiddlewareExample() {
  console.log('\n=== Express Middleware Example (CommonJS) ===\n');

  const conceptualCode = `
// middleware/validateEmail.js
module.exports = function validateEmail(field = 'email') {
  return async (req, res, next) => {
    const email = req.body[field];
    
    try {
      const result = await emailValidator(email, {
        detailed: true,
        checkMx: true,
        checkDisposable: true
      });
      
      if (!result.valid) {
        return res.status(400).json({
          error: 'Invalid email',
          field: field,
          code: result.errorCode,
          message: result.reason
        });
      }
      
      req.validatedEmail = email;
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Email validation failed',
        message: error.message
      });
    }
  };
};

// Usage in Express route:
const validateEmail = require('./middleware/validateEmail');

app.post('/register', validateEmail('email'), (req, res) => {
  // Email is already validated
  const email = req.validatedEmail;
  // Continue with registration...
});`;

  console.log('Example Express middleware:');
  console.log(conceptualCode);
}

// Main function to run all examples
async function main() {
  console.log('Node Email Verifier - CommonJS Examples\n');
  console.log('Library version:', require('../package.json').version);
  console.log('Node.js version:', process.version);
  console.log('');

  await basicExample();
  await promiseExample();

  // Wait for promise example to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  callbackExample();

  // Wait for callback example to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await detailedExample();
  await batchProcessing();
  await errorHandlingExample();
  expressMiddlewareExample();
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other modules
module.exports = {
  validateEmailCallback,
  basicExample,
  detailedExample,
};
