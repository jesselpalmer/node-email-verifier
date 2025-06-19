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

  it('should be importable by package name', async () => {
    // Since we're in development, we can't actually test the package name import
    // but we can verify the export configuration is correct for when it's published
    expect(packageJson.name).toBe('node-email-verifier');
    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['.'].import).toBeDefined();
    expect(packageJson.exports['.'].require).toBeDefined();

    // Test the actual functionality using relative import
    const emailValidator = await import('../dist/index.js');
    const result = await emailValidator.default('test@example.com', {
      checkMx: false,
    });
    expect(result).toBe(true);
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

  it('should validate email using imported function', async () => {
    const emailValidator = await import('../dist/index.js');
    const result = await emailValidator.default('test@example.com', {
      checkMx: false,
    });
    expect(result).toBe(true);
  });

  it('should have CommonJS wrapper file', () => {
    const cjsPath = join(process.cwd(), 'dist', 'index.cjs');
    expect(existsSync(cjsPath)).toBe(true);
  });
});
