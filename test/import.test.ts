import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Package Import', () => {
  it('should be importable as ESM module from dist', async () => {
    // Import from the built dist file directly
    const emailValidator = await import('../dist/index.js');
    expect(emailValidator).toBeDefined();
    expect(emailValidator.default).toBeDefined();
    expect(typeof emailValidator.default).toBe('function');
  });

  it('should have correct package.json exports field', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.exports).toBeDefined();
    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['.'].import).toBe('./dist/index.js');
    expect(packageJson.exports['.'].types).toBe('./dist/index.d.ts');
  });

  it('should have type module in package.json', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.type).toBe('module');
  });

  it('should have main field pointing to dist/index.js', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.main).toBe('./dist/index.js');
  });

  it('should have types field pointing to dist/index.d.ts', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.types).toBe('./dist/index.d.ts');
  });

  it('should validate email using imported function', async () => {
    const emailValidator = await import('../dist/index.js');
    const result = await emailValidator.default('test@example.com', {
      checkMx: false,
    });
    expect(result).toBe(true);
  });
});
