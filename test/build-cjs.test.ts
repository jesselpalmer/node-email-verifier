/**
 * Note: This test requires the dist directory and index.cjs file to exist.
 * Always run tests using `npm test` which includes the build step.
 * Running this test in isolation without building first will fail.
 */
import { describe, it, expect } from '@jest/globals';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Build CJS Script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'build-cjs.js');
  const distPath = path.join(process.cwd(), 'dist');
  const cjsPath = path.join(distPath, 'index.cjs');

  it('should create CommonJS wrapper successfully', () => {
    // Run the build script
    const output = execFileSync('node', [scriptPath], { encoding: 'utf8' });

    // Check output message
    expect(output).toContain('Created CommonJS wrapper at');
    expect(output).toContain('dist/index.cjs');

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
        execFileSync('node', [scriptPath], { encoding: 'utf8', stdio: 'pipe' });
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

  it('should create the specified output directory when it does not exist', () => {
    // Create a temporary directory for testing using mkdtempSync
    const tempBuildDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'node-email-verifier-test-')
    );
    const outputFilePath = path.join(tempBuildDir, 'index.cjs');

    try {
      // Run the build script with the temp directory as argument
      const output = execFileSync('node', [scriptPath, tempBuildDir], {
        encoding: 'utf8',
      });

      // Verify the console output shows the absolute path for temp directory
      expect(output).toContain('Created CommonJS wrapper at');
      expect(output).toContain(tempBuildDir);

      // Verify wrapper file exists in temp directory
      expect(fs.existsSync(outputFilePath)).toBe(true);

      // Verify content
      const content = fs.readFileSync(outputFilePath, 'utf8');
      expect(content).toContain('module.exports');
      expect(content).toContain('import(');
    } finally {
      // Clean up the temporary directory
      if (fs.existsSync(tempBuildDir)) {
        fs.rmSync(tempBuildDir, { recursive: true, force: true });
      }
    }
  });
});
