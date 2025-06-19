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

const distPath = path.join(__dirname, '..', 'dist');
const cjsPath = path.join(distPath, 'index.cjs');

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Write the CJS wrapper
fs.writeFileSync(cjsPath, cjsWrapper);
console.log('Created CommonJS wrapper at dist/index.cjs');
