import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Package Import', () => {
  let packageJson: any;

  beforeAll(() => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  });

  it('should be importable as ESM module from dist', async () => {
    // Import from the built dist file directly
    const emailValidator = await import('../dist/index.js');
    expect(emailValidator).toBeDefined();
    expect(emailValidator.default).toBeDefined();
    expect(typeof emailValidator.default).toBe('function');
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

    try {
      // Run the CommonJS test file
      execSync('node test/commonjs-test.cjs', { stdio: 'pipe' });
      // If no error is thrown, the test passed
      expect(true).toBe(true);
    } catch (error) {
      // If an error is thrown, the test failed
      throw new Error(`CommonJS test failed: ${error}`);
    }
  });
});
