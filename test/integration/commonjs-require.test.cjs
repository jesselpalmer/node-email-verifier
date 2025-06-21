const assert = require('assert');
const path = require('path');

// Test CommonJS require
async function testCommonJS() {
  try {
    // Test requiring the built package
    const emailValidator = require('../../dist/index.cjs');

    console.log('Testing CommonJS require...');

    // Test that it's a function
    assert(
      typeof emailValidator === 'function',
      'emailValidator should be a function'
    );

    // Test basic validation
    const result = await emailValidator('test@example.com', { checkMx: false });
    assert(result === true, 'Valid email should return true');

    // Test invalid email
    const invalidResult = await emailValidator('invalid-email', {
      checkMx: false,
    });
    assert(invalidResult === false, 'Invalid email should return false');

    // Test with detailed results
    const detailedResult = await emailValidator('test@example.com', {
      checkMx: false,
      detailed: true,
    });
    assert(
      typeof detailedResult === 'object',
      'Detailed results should return an object'
    );
    assert(
      detailedResult.valid === true,
      'Valid email should have valid: true in detailed results'
    );
    assert(
      detailedResult.email === 'test@example.com',
      'Should include the email in results'
    );

    console.log('✓ CommonJS require tests passed');
  } catch (error) {
    console.error('✗ CommonJS test failed:', error);
    process.exit(1);
  }
}

// Test dynamic import in CommonJS context
async function testDynamicImport() {
  try {
    console.log('Testing dynamic import in CommonJS...');

    // Test dynamic import of the ESM module
    const { default: emailValidator } = await import('../../dist/index.js');

    // Test that it's a function
    assert(
      typeof emailValidator === 'function',
      'Dynamically imported emailValidator should be a function'
    );

    // Test basic validation
    const result = await emailValidator('test@example.com', { checkMx: false });
    assert(
      result === true,
      'Valid email should return true with dynamic import'
    );

    console.log('✓ Dynamic import tests passed');
  } catch (error) {
    console.error('✗ Dynamic import test failed:', error);
    process.exit(1);
  }
}

// Run all tests
async function runAllTests() {
  await testCommonJS();
  await testDynamicImport();
  console.log('\n✓ All CommonJS tests passed successfully');
}

runAllTests();
