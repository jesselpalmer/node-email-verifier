#!/usr/bin/env node

/**
 * Test package installation locally
 * This simulates what the GitHub Action does to catch issues early
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

console.log('🧪 Testing package installation locally...\n');

// Save original directory
const originalDir = process.cwd();

// Build first to ensure dist files exist
console.log('🔨 Building project...');
execSync('npm run build', { stdio: 'inherit' });
console.log('');

const testDir = mkdtempSync(join(tmpdir(), 'npm-test-'));
console.log(`📁 Test directory: ${testDir}\n`);

try {
  // Pack the package
  console.log('📦 Packing the package...');
  const packOutput = execSync('npm pack --json', { encoding: 'utf8' });
  let packInfo;
  try {
    packInfo = JSON.parse(packOutput);
  } catch (parseError) {
    console.error(
      '\n❌ Failed to parse JSON output from `npm pack`:',
      parseError.message
    );
    console.error('Raw output:', packOutput);
    process.exit(1);
  }

  if (!packInfo || !packInfo[0] || !packInfo[0].filename) {
    console.error('\n❌ npm pack output missing expected filename property');
    console.error('Pack info:', packInfo);
    process.exit(1);
  }

  const packageFile = packInfo[0].filename;
  console.log(`✓ Created ${packageFile}\n`);

  // Move to test directory
  execSync(`mv ${packageFile} ${testDir}/`);
  process.chdir(testDir);

  // Initialize test project
  console.log('🔧 Initializing test project...');
  execSync('npm init -y --silent');

  // Install the package
  console.log('📥 Installing package...');
  execSync(`npm install ./${packageFile} --silent`, { stdio: 'inherit' });
  console.log('✓ Package installed\n');

  // Test ESM import
  console.log('🧪 Testing ESM import...');
  execSync(
    `echo 'import emailValidator from "node-email-verifier"; console.log("✓ ESM import works");' > test.mjs && node test.mjs`,
    { stdio: 'inherit' }
  );

  // Test CommonJS require
  console.log('\n🧪 Testing CommonJS require...');
  execSync(
    `echo 'const emailValidator = require("node-email-verifier"); console.log("✓ CommonJS require works");' > test.js && node test.js`,
    { stdio: 'inherit' }
  );

  // Test TypeScript
  console.log('\n🧪 Testing TypeScript types...');
  execSync('npm install --save-dev typescript @types/node --silent');

  const tsConfig = {
    compilerOptions: {
      module: 'commonjs',
      target: 'es2020',
      moduleResolution: 'node',
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  };

  execSync(`echo '${JSON.stringify(tsConfig)}' > tsconfig.json`);
  execSync(
    `echo 'import emailValidator from "node-email-verifier"; async function test() { await emailValidator("test@example.com"); console.log("✓ TypeScript types work"); } test();' > test.ts`
  );
  execSync('npx tsc test.ts && node test.js', { stdio: 'inherit' });

  console.log('\n✅ All installation tests passed!\n');
} catch (error) {
  console.error('\n❌ Installation test failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup - restore original directory
  process.chdir(originalDir);
  rmSync(testDir, { recursive: true, force: true });
}
