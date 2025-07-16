/**
 * Shared configuration for package validation
 * Used by both check-npm-package.js and GitHub Actions
 */

export const REQUIRED_FILES = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/index.cjs',
  'package.json',
  'README.md',
  'LICENSE',
];

export const FORBIDDEN_FILES = [
  'test/',
  '.github/',
  'scripts/',
  'coverage/',
  '.git/',
  'node_modules/',
  '.npmignore',
  '.gitignore',
  // AI-related documentation files (specific filenames related to AI tools)
  'CLAUDE.md',
  'CURSOR.md',
  'COPILOT.md',
  '.cursorrules',
  '.aider*',
];

export const PACKAGE_SIZE_LIMIT_KB = 1024; // 1MB
