#!/usr/bin/env node

/**
 * Pre-publish check to verify npm package contents
 * This prevents issues like missing dist files
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Required files that must be in the npm package
const REQUIRED_FILES = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/index.cjs',
  'package.json',
  'README.md',
  'LICENSE',
];

// Files that should NOT be in the npm package
const FORBIDDEN_FILES = [
  'test/',
  '.github/',
  'scripts/',
  'coverage/',
  '.git/',
  'node_modules/',
  'CLAUDE.md',
  '.npmignore',
  '.gitignore',
];

console.log('🔍 Checking npm package contents...\n');

try {
  // Get the list of files that would be published
  const output = execSync('npm pack --dry-run --json', {
    cwd: rootDir,
    encoding: 'utf8',
  });

  const packInfo = JSON.parse(output);
  const files = packInfo[0].files.map((f) => f.path);

  console.log(`📦 Package would include ${files.length} files\n`);

  // Check for required files
  console.log('✅ Checking required files:');
  let hasErrors = false;

  for (const requiredFile of REQUIRED_FILES) {
    const isIncluded = files.some(
      (f) => f === requiredFile || f.startsWith(`${requiredFile}/`)
    );
    if (isIncluded) {
      console.log(`  ✓ ${requiredFile}`);
    } else {
      console.error(`  ✗ ${requiredFile} - MISSING!`);
      hasErrors = true;
    }
  }

  console.log('\n🚫 Checking for forbidden files:');
  for (const forbiddenFile of FORBIDDEN_FILES) {
    const isIncluded = files.some(
      (f) => f === forbiddenFile || f.startsWith(forbiddenFile)
    );
    if (isIncluded) {
      console.error(`  ✗ ${forbiddenFile} - Should NOT be included!`);
      hasErrors = true;
    } else {
      console.log(`  ✓ ${forbiddenFile} - correctly excluded`);
    }
  }

  // Check package.json exports
  console.log('\n📋 Checking package.json exports:');
  const packageJson = JSON.parse(
    readFileSync(join(rootDir, 'package.json'), 'utf8')
  );

  const checkExport = (exportPath, description) => {
    const normalizedPath = exportPath.replace(/^\.\//, '');
    const isIncluded = files.includes(normalizedPath);
    if (isIncluded) {
      console.log(`  ✓ ${description}: ${exportPath}`);
    } else {
      console.error(`  ✗ ${description}: ${exportPath} - MISSING!`);
      hasErrors = true;
    }
  };

  if (packageJson.main) {
    checkExport(packageJson.main, 'main');
  }
  if (packageJson.types) {
    checkExport(packageJson.types, 'types');
  }
  if (packageJson.exports?.['.']) {
    const exp = packageJson.exports['.'];
    if (exp.import) checkExport(exp.import, 'exports.import');
    if (exp.require) checkExport(exp.require, 'exports.require');
    if (exp.types) checkExport(exp.types, 'exports.types');
  }

  // Check file sizes
  console.log('\n📊 Package size info:');
  const totalSize = packInfo[0].size;
  const unpackedSize = packInfo[0].unpackedSize;
  console.log(`  Total size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`  Unpacked size: ${(unpackedSize / 1024).toFixed(2)} KB`);

  if (hasErrors) {
    console.error(
      '\n❌ Package validation failed! Fix the issues above before publishing.\n'
    );
    process.exit(1);
  } else {
    console.log('\n✅ Package validation passed! Ready to publish.\n');
  }
} catch (error) {
  console.error('❌ Error checking package:', error.message);
  process.exit(1);
}
