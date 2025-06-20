#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import yamlLint from 'yaml-lint';

const ignorePaths = ['node_modules', 'dist', '.git/'];
let hasErrors = false;

function findYamlFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);

    // Skip ignored directories
    if (ignorePaths.some((ignore) => fullPath.includes(ignore))) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findYamlFiles(fullPath, files);
    } else if (['.yml', '.yaml'].includes(extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function lintYamlFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    await yamlLint.lint(content);
    console.log(`✓ ${filePath}`);
  } catch (error) {
    console.error(`✗ ${filePath}: ${error.message}`);
    hasErrors = true;
  }
}

async function main() {
  console.log('Linting YAML files...\n');

  const yamlFiles = findYamlFiles(process.cwd());

  if (yamlFiles.length === 0) {
    console.log('No YAML files found to lint.');
    return;
  }

  for (const file of yamlFiles) {
    await lintYamlFile(file);
  }

  console.log(`\n${yamlFiles.length} files checked.`);

  if (hasErrors) {
    console.error('\nYAML linting failed!');
    process.exit(1);
  } else {
    console.log('\nAll YAML files are valid!');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
