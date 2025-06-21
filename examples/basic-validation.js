#!/usr/bin/env node

/**
 * Basic Email Validation Example
 *
 * This example demonstrates the simplest use case for node-email-verifier.
 * It validates email addresses and returns a boolean result.
 */

import emailValidator from 'node-email-verifier';

// Example 1: Simple validation (returns boolean)
async function basicValidation() {
  console.log('=== Basic Email Validation ===\n');

  const emails = [
    'valid@example.com',
    'user.name+tag@company.org',
    'invalid.email',
    '@invalid.com',
    'user@',
    '',
    'user@nonexistent-domain-12345.com',
    'test@disposable.com',
  ];

  console.log('Simple validation (format only):');
  for (const email of emails) {
    const isValid = await emailValidator(email);
    console.log(`${email.padEnd(35)} → ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  }
}

// Example 2: Validation with MX record checking
async function mxValidation() {
  console.log('\n\nValidation with MX record checking:');

  const testEmails = [
    'test@gmail.com', // Valid format and domain
    'user@example.com', // Valid format, example domain
    'test@nonexistent-12345.com', // Valid format, no MX records
  ];

  for (const email of testEmails) {
    try {
      const isValid = await emailValidator(email, { checkMx: true });
      console.log(
        `${email.padEnd(30)} → ${isValid ? '✅ Valid' : '❌ Invalid'}`
      );
    } catch (error) {
      console.log(`${email.padEnd(30)} → ❌ Error: ${error.message}`);
    }
  }
}

// Example 3: Quick validation function for your application
async function isEmailValid(email) {
  try {
    return await emailValidator(email, {
      checkMx: true,
      timeout: 5000, // 5 second timeout
    });
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

async function helperFunctionExample() {
  console.log('\n\nUsing helper function:');
  const result = await isEmailValid('contact@nodejs.org');
  console.log(`contact@nodejs.org is ${result ? 'valid' : 'invalid'}`);
}

// Main execution
async function main() {
  await basicValidation();
  await mxValidation();
  await helperFunctionExample();
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
