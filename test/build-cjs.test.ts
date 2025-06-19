/**
 * Note: This test requires the dist directory and index.cjs file to exist.
 * Always run tests using `npm test` which includes the build step.
 * Running this test in isolation without building first will fail.
 */
import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Build CJS Script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'build-cjs.js');
  const distPath = path.join(process.cwd(), 'dist');
  const cjsPath = path.join(distPath, 'index.cjs');

  it('should create CommonJS wrapper successfully', () => {
    // Run the build script
    const output = execSync(`node ${scriptPath}`, { encoding: 'utf8' });

    // Check output message
    expect(output).toContain('Created CommonJS wrapper at dist/index.cjs');

    // Verify file exists
    expect(fs.existsSync(cjsPath)).toBe(true);

    // Verify content
    const content = fs.readFileSync(cjsPath, 'utf8');
    expect(content).toContain('module.exports');
    expect(content).toContain('import(');
    expect(content).toContain('./index.js');
  });

  it('should handle file system errors gracefully', () => {
    // Make dist directory read-only to simulate permission error
    const originalMode = fs.statSync(distPath).mode;

    try {
      // Remove write permissions
      fs.chmodSync(distPath, 0o444);

      // Attempt to run build script - should fail gracefully
      let exitCode = 0;
      let errorOutput = '';

      try {
        execSync(`node ${scriptPath}`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (error: any) {
        exitCode = error.status;
        errorOutput =
          error.stderr?.toString() || error.stdout?.toString() || '';
      }

      // Should exit with code 1
      expect(exitCode).toBe(1);

      // Should contain error message
      expect(errorOutput).toContain('Failed to create CommonJS wrapper');

      // Should contain stack trace
      expect(errorOutput).toContain('Stack trace:');
    } finally {
      // Restore original permissions
      fs.chmodSync(distPath, originalMode);
    }
  });

  it('should create dist directory if it does not exist', () => {
    // Remove dist directory if it exists
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }

    // Run the build script
    execSync(`node ${scriptPath}`, { encoding: 'utf8' });

    // Verify dist directory was created
    expect(fs.existsSync(distPath)).toBe(true);

    // Verify wrapper file exists
    expect(fs.existsSync(cjsPath)).toBe(true);
  });
});
