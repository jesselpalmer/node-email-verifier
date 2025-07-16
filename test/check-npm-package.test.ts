import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync, execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('check-npm-package.js', () => {
  const scriptPath = join(__dirname, '..', 'scripts', 'check-npm-package.js');

  beforeAll(() => {
    // Ensure dist directory exists for tests
    // Always run build to ensure fresh dist files
    execSync('npm run build', { stdio: 'ignore' });
  });

  // Helper function to run the package validation script
  const runPackageCheck = () => {
    return execFileSync('node', [scriptPath], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  };

  it('should exist', () => {
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('should pass when all required files are present', () => {
    const result = runPackageCheck();

    expect(result).toContain('✅ Package validation passed!');
    expect(result).toContain('dist/index.js');
    expect(result).toContain('dist/index.d.ts');
    expect(result).toContain('dist/index.cjs');
  });

  it('should check for forbidden files', () => {
    const result = runPackageCheck();

    // Check that forbidden files are correctly excluded
    expect(result).toContain('test/ - correctly excluded');
    expect(result).toContain('.github/ - correctly excluded');
    expect(result).toContain('scripts/ - correctly excluded');
    expect(result).toContain('CLAUDE.md - correctly excluded');
  });

  it('should report package size', () => {
    const result = runPackageCheck();

    expect(result).toContain('Package size info:');
    expect(result).toMatch(/Total size: \d+\.\d+ KB/);
    expect(result).toMatch(/Unpacked size: \d+\.\d+ KB/);
  });

  it('should validate package.json exports', () => {
    const result = runPackageCheck();

    expect(result).toContain('Checking package.json exports:');
    expect(result).toContain('✓ main: ./dist/index.js');
    expect(result).toContain('✓ types: ./dist/index.d.ts');
    expect(result).toContain('✓ exports.import: ./dist/index.js');
    expect(result).toContain('✓ exports.require: ./dist/index.cjs');
  });
});
