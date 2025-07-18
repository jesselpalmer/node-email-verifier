/**
 * Note: This test requires the dist directory to exist.
 * Always run tests using `npm test` which includes the build step.
 * Running this test in isolation without building first will fail.
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { waitForFilesToExist } from './helpers/retry.js';

const RETRY_INTERVAL_MS = 200; // Increased interval
const MAX_RETRIES = 150; // 30 seconds total timeout
const MIN_FILE_CONTENT_LENGTH = 10; // Minimum expected content length for built files
const FILE_SYSTEM_DELAY_MS = 100; // Delay to ensure file system has fully written files

describe('Package Import', () => {
  let packageJson: any;

  beforeEach(() => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  });

  it('should be importable as ESM module from dist', async () => {
    // Ensure dist file exists before importing
    const distPath = join(process.cwd(), 'dist');
    const indexPath = join(distPath, 'index.js');

    // Wait for file to exist
    await waitForFilesToExist([indexPath], MAX_RETRIES, RETRY_INTERVAL_MS);

    // Import from the built dist file directly
    const emailValidator = await import('../dist/index.js');
    expect(emailValidator).toBeDefined();
    expect(emailValidator.default).toBeDefined();
    expect(typeof emailValidator.default).toBe('function');

    // Verify enhanced TypeScript exports
    expect(emailValidator.ErrorCode).toBeDefined();
    expect(emailValidator.EmailValidationError).toBeDefined();
    expect(emailValidator.isEmailValidationError).toBeDefined();
    expect(typeof emailValidator.isEmailValidationError).toBe('function');
  });

  it('should have correct configuration for package name imports', () => {
    // Verify the package.json configuration that enables importing by package name
    // Note: We can't actually test 'import("node-email-verifier")' in development
    // but we verify the configuration is correct for when the package is published
    expect(packageJson.name).toBe('node-email-verifier');
    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['.'].import).toBeDefined();
    expect(packageJson.exports['.'].require).toBeDefined();
  });

  it('should have correct package.json exports field', () => {
    expect(packageJson.exports).toBeDefined();
    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['.'].import).toBe('./dist/index.js');
    expect(packageJson.exports['.'].require).toBe('./dist/index.cjs');
    expect(packageJson.exports['.'].types).toBe('./dist/index.d.ts');
  });

  it('should have type module in package.json', () => {
    expect(packageJson.type).toBe('module');
  });

  it('should have main field pointing to dist/index.js', () => {
    expect(packageJson.main).toBe('./dist/index.js');
  });

  it('should have types field pointing to dist/index.d.ts', () => {
    expect(packageJson.types).toBe('./dist/index.d.ts');
  });

  it('should have CommonJS wrapper file', () => {
    const cjsPath = join(process.cwd(), 'dist', 'index.cjs');
    expect(existsSync(cjsPath)).toBe(true);
  });

  it('should have correct CommonJS wrapper content', () => {
    const cjsPath = join(process.cwd(), 'dist', 'index.cjs');
    const content = readFileSync(cjsPath, 'utf-8');

    // Verify the wrapper exports a function that returns a promise
    expect(content).toContain('module.exports');
    expect(content).toContain('import(');
    expect(content).toContain('./index.js');
    expect(content).toContain('.then(mod => mod.default');

    // Verify it forwards all arguments
    expect(content).toContain('...args');
  });

  it('should work with CommonJS require', async () => {
    // Since we're in an ESM environment, we'll use child_process to test CJS
    const { execSync } = await import('child_process');

    // Ensure dist files exist before running test
    const distPath = join(process.cwd(), 'dist');
    const indexPath = join(distPath, 'index.js');
    const cjsPath = join(distPath, 'index.cjs');

    // Wait for files to exist and have content
    await waitForFilesToExist(
      [indexPath, cjsPath],
      MAX_RETRIES,
      RETRY_INTERVAL_MS
    );

    // Additional check to ensure files have content
    const cjsContent = readFileSync(cjsPath, 'utf-8');
    if (cjsContent.length < MIN_FILE_CONTENT_LENGTH) {
      throw new Error('CommonJS wrapper file appears to be empty');
    }

    const indexContent = readFileSync(indexPath, 'utf-8');
    if (indexContent.length < MIN_FILE_CONTENT_LENGTH) {
      throw new Error('ESM index.js file appears to be empty');
    }

    // Verify the CommonJS wrapper is valid JavaScript
    if (!cjsContent.includes('module.exports')) {
      throw new Error('CommonJS wrapper does not contain module.exports');
    }

    // Add a small delay to ensure file system has fully written the files
    await new Promise((resolve) => setTimeout(resolve, FILE_SYSTEM_DELAY_MS));

    try {
      // Run the CommonJS test file
      execSync('node test/integration/commonjs-require.test.cjs', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });
      // If no error is thrown, the test passed
      expect(true).toBe(true);
    } catch (error: any) {
      // If an error is thrown, the test failed
      const errorMessage = error.stderr || error.stdout || error.message;
      throw new Error(`CommonJS test failed: ${errorMessage}`);
    }
  }, 20000); // 20 second timeout
});
