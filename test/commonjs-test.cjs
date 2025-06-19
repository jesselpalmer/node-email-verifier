const assert = require('assert');
const path = require('path');

// Test CommonJS require
async function testCommonJS() {
  try {
    // Test requiring the built package
    const emailValidator = require('../dist/index.cjs');

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

    console.log('✓ CommonJS require tests passed');
  } catch (error) {
    console.error('✗ CommonJS test failed:', error);
    process.exit(1);
  }
}

testCommonJS();
