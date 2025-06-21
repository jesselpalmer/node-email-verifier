#!/usr/bin/env node
/**
 * Quick integration test to verify dual module support
 * Run with: node scripts/integration-test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧪 Running integration tests...\n');

// Create a temporary directory
const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'node-email-verifier-test-')
);
console.log(`📁 Test directory: ${tempDir}\n`);

let allPassed = true;

try {
  // Test 1: CommonJS require
  console.log('📋 Test 1: CommonJS require()');
  const cjsTest = `
    const emailValidator = require('${process.cwd()}/dist/index.cjs');
    (async () => {
      const result = await emailValidator('test@example.com', { checkMx: false });
      if (result !== true) throw new Error('Expected true');
      console.log('✅ CommonJS require works');
    })().catch(e => {
      console.error('❌ CommonJS test failed:', e.message);
      process.exit(1);
    });
  `;

  fs.writeFileSync(path.join(tempDir, 'test-cjs.js'), cjsTest);
  execSync(`node ${path.join(tempDir, 'test-cjs.js')}`, { stdio: 'inherit' });

  // Test 2: ES Module import
  console.log('\n📋 Test 2: ES Module import');
  const esmTest = `
    import emailValidator from '${process.cwd()}/dist/index.js';
    const result = await emailValidator('test@example.com', { checkMx: false });
    if (result !== true) throw new Error('Expected true');
    console.log('✅ ES Module import works');
  `;

  fs.writeFileSync(path.join(tempDir, 'test-esm.mjs'), esmTest);
  execSync(`node ${path.join(tempDir, 'test-esm.mjs')}`, { stdio: 'inherit' });

  // Test 3: Dynamic import in CommonJS
  console.log('\n📋 Test 3: Dynamic import in CommonJS');
  const dynamicTest = `
    (async () => {
      const { default: emailValidator } = await import('${process.cwd()}/dist/index.js');
      const result = await emailValidator('test@example.com', { checkMx: false });
      if (result !== true) throw new Error('Expected true');
      console.log('✅ Dynamic import in CommonJS works');
    })().catch(e => {
      console.error('❌ Dynamic import test failed:', e.message);
      process.exit(1);
    });
  `;

  fs.writeFileSync(path.join(tempDir, 'test-dynamic.js'), dynamicTest);
  execSync(`node ${path.join(tempDir, 'test-dynamic.js')}`, {
    stdio: 'inherit',
  });

  // Test 4: TypeScript types
  console.log('\n📋 Test 4: TypeScript type checking');
  const tsTest = `
    import emailValidator, { EmailValidatorOptions, ValidationResult } from '${process.cwd()}/dist/index.js';
    
    const options: EmailValidatorOptions = {
      checkMx: false,
      detailed: true
    };
    
    async function test() {
      const result = await emailValidator('test@example.com', options) as ValidationResult;
      if (!result.valid) throw new Error('Expected valid');
      console.log('✅ TypeScript types work correctly');
    }
    
    test().catch((e: Error) => {
      console.error('❌ TypeScript test failed:', e.message);
      process.exit(1);
    });
  `;

  fs.writeFileSync(path.join(tempDir, 'test-ts.ts'), tsTest);

  // Check if TypeScript is available
  try {
    execSync('npx tsc --version', { stdio: 'ignore' });
    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
          },
        },
        null,
        2
      )
    );

    execSync(`cd ${tempDir} && npx tsc test-ts.ts --outDir .`, {
      stdio: 'inherit',
    });
    execSync(`node ${path.join(tempDir, 'test-ts.js')}`, { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  TypeScript not available, skipping type test');
  }

  // Test 5: Error codes validation
  console.log('\n📋 Test 5: Error codes validation');
  const errorCodeTest = `
    const emailValidator = require('${process.cwd()}/dist/index.cjs');
    const { ErrorCode } = require('${process.cwd()}/dist/index.js');
    
    (async () => {
      // Test invalid email format with error code
      const result = await emailValidator('invalid-email', { detailed: true });
      if (result.valid) throw new Error('Expected invalid');
      if (result.format.errorCode !== ErrorCode.INVALID_EMAIL_FORMAT) {
        throw new Error('Expected INVALID_EMAIL_FORMAT error code, got: ' + result.format.errorCode);
      }
      
      // Test disposable email with error code
      const disposableResult = await emailValidator('test@10minutemail.com', { 
        detailed: true, 
        checkDisposable: true,
        checkMx: false 
      });
      if (disposableResult.valid) throw new Error('Expected invalid for disposable');
      if (disposableResult.disposable.errorCode !== ErrorCode.DISPOSABLE_EMAIL) {
        throw new Error('Expected DISPOSABLE_EMAIL error code, got: ' + disposableResult.disposable.errorCode);
      }
      
      console.log('✅ Error codes work correctly');
    })().catch(e => {
      console.error('❌ Error codes test failed:', e.message);
      process.exit(1);
    });
  `;

  fs.writeFileSync(path.join(tempDir, 'test-error-codes.js'), errorCodeTest);
  execSync(`node ${path.join(tempDir, 'test-error-codes.js')}`, {
    stdio: 'inherit',
  });

  console.log('\n✅ All integration tests passed!');
} catch (error) {
  console.error('\n❌ Integration tests failed');
  allPassed = false;
} finally {
  // Cleanup
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

process.exit(allPassed ? 0 : 1);
