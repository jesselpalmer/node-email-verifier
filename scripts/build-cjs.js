import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cjsWrapper = `module.exports = (...args) => import('./index.js').then(mod => mod.default(...args));`;

const distPath = path.join(__dirname, '..', 'dist');
const cjsPath = path.join(distPath, 'index.cjs');

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Write the CJS wrapper
fs.writeFileSync(cjsPath, cjsWrapper);
console.log('Created CommonJS wrapper at dist/index.cjs');
