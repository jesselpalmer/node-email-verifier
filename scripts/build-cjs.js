/**
 * Build script to create CommonJS wrapper for ESM module
 *
 * This script generates a CommonJS wrapper file (index.cjs) that allows
 * the ESM module to be used with require() syntax in CommonJS environments.
 * The wrapper uses dynamic import() to load the ESM module and returns
 * a promise that resolves to the default export.
 *
 * @example
 * // CommonJS usage with the generated wrapper:
 * const emailValidator = require('node-email-verifier');
 * await emailValidator('test@example.com'); // Returns promise
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CommonJS wrapper content that enables require() syntax support.
 * The wrapper function accepts all arguments and passes them to the
 * dynamically imported ESM module's default export.
 */
const cjsWrapper = `module.exports = (...args) => import('./index.js').then(mod => mod.default(...args));\n`;

// Get output directory from command line arguments or use default
const outputDir = process.argv[2] || path.join(__dirname, '..', 'dist');
const outputPath = path.resolve(outputDir);
const cjsPath = path.join(outputPath, 'index.cjs');

try {
  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Write the CJS wrapper
  fs.writeFileSync(cjsPath, cjsWrapper);

  // Log the path - use absolute for temp directories, relative for project directories
  const isProjectDir = outputPath.startsWith(path.dirname(__dirname));
  const displayPath = isProjectDir
    ? path.relative(process.cwd(), cjsPath)
    : cjsPath;
  console.log(`Created CommonJS wrapper at ${displayPath}`);
} catch (error) {
  console.error('Failed to create CommonJS wrapper:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
