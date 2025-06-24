import emailValidator, {
  ErrorCode,
  EmailValidationError,
  isEmailValidationError,
} from '../dist/index.js';

// Example 1: Using the error types for better error handling
async function validateWithErrorHandling(email) {
  try {
    const result = await emailValidator(email, {
      checkMx: true,
      timeout: 2000,
    });
    console.log(`Email ${email} is valid:`, result);
  } catch (error) {
    // Use the type guard to check if it's our custom error
    if (isEmailValidationError(error)) {
      console.log('Email validation error:', error.code);
      console.log('Error message:', error.message);

      // Handle specific error codes
      switch (error.code) {
        case ErrorCode.DNS_LOOKUP_TIMEOUT:
          console.log('DNS lookup timed out, try again later');
          break;
        case ErrorCode.INVALID_TIMEOUT_VALUE:
          console.log('Invalid timeout configuration');
          break;
        default:
          console.log('Other validation error:', error.code);
      }
    } else {
      console.log('Unexpected error:', error);
    }
  }
}

// Example 2: Creating custom validation errors
function createCustomValidationError(email) {
  const error = new EmailValidationError(
    ErrorCode.INVALID_EMAIL_FORMAT,
    `Custom validation failed for ${email}`
  );
  return error;
}

// Example 3: Using detailed results with MxRecord type
async function validateWithDetails(email) {
  const result = await emailValidator(email, {
    detailed: true,
    checkMx: true,
  });

  if (result.mx?.records) {
    console.log('MX Records:');
    // TypeScript knows these are MxRecord objects
    result.mx.records.forEach((record) => {
      console.log(`  ${record.priority}: ${record.exchange}`);
    });
  }

  return result;
}

// Run examples
console.log('=== Enhanced TypeScript Types Examples ===\n');

console.log('1. Error handling with type guard:');
await validateWithErrorHandling('test@invalid-timeout');
await validateWithErrorHandling('test@example.com');

console.log('\n2. Custom validation error:');
const customError = createCustomValidationError('bad@email');
console.log('Is EmailValidationError?', isEmailValidationError(customError));
console.log('Error code:', customError.code);

console.log('\n3. Detailed validation with MX records:');
await validateWithDetails('test@google.com');

console.log('\n4. Available error codes:');
console.log(Object.keys(ErrorCode).join(', '));
