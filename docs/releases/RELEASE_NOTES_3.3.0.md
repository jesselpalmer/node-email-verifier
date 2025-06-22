# Release Instructions for v3.3.0

## Pre-Release Checklist ✓

### 1. Code Quality ✓

- [x] All tests passing: `npm test`
- [x] No linting errors: `npm run lint:all`
- [x] Code formatted: `npm run format:check`
- [x] Full check passes: `npm run check`

### 2. Documentation Review ✓

- [x] README.md is up to date
- [x] CHANGELOG.md has all changes documented
- [x] API documentation reflects new features
- [x] Examples in the examples/ directory work
- [x] All example files are tested and functional

### 3. Version Decision ✓

- **Minor Release (3.3.0)**: New features (AI Debug Mode + Examples), backward compatible

## Release Steps

### 1. ✓ Already Completed

- Version already bumped to 3.3.0 in package.json
- CHANGELOG.md already updated with release date

### 2. Create and Push Tag

```bash
# Create a signed tag
git tag -s v3.3.0 -m "Release v3.3.0"

# Push commits and tags
git push origin main --follow-tags
```

### 3. Publish to npm

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# Run final checks
npm run check

# Test the build
npm run build

# Publish to npm
npm publish
```

### 4. Create GitHub Release

1. Go to: <https://github.com/jesselpalmer/node-email-verifier/releases/new>
2. Select tag: `v3.3.0`
3. Title: `v3.3.0`
4. Copy the release notes below as the description
5. Publish release

---

## Release Notes for GitHub

## 🎯 Key Highlights

### AI Debug Mode

- Revolutionary debugging experience with structured JSON logging
- MCP-compatible format for AI-assisted debugging workflows
- Performance metrics and memory tracking for optimization
- Production-ready debug wrapper example

### Comprehensive Examples Directory

- Six real-world examples covering all major use cases
- From basic validation to advanced TypeScript integration
- Bulk processing strategies and error handling patterns
- Full CommonJS and ESM compatibility examples

## 📝 What's Changed

### Added

#### AI Debug Mode (`debug: true` option)

- **Structured JSON logging** with MCP-compatible format for AI tooling
- **Performance timing** for each validation phase (format check, MX lookup, disposable check)
- **Memory usage tracking** including heap, RSS, and external memory
- **Detailed error logging** with stack traces for debugging
- **Production wrapper example** showing how to collect and analyze debug data

#### Examples Directory

- **`examples/basic-validation.js`** - Getting started with simple email validation
- **`examples/typescript-usage.ts`** - Full TypeScript integration with all types
- **`examples/bulk-validation.js`** - Efficient strategies for validating email lists
- **`examples/error-handling.js`** - Comprehensive error handling with error codes
- **`examples/commonjs-usage.cjs`** - CommonJS compatibility and promise handling
- **`examples/debug-mode.js`** - AI Debug Mode usage and production patterns

## 💻 Quick Example

### Debug Mode

```javascript
import emailValidator from 'node-email-verifier';

// Enable debug mode for detailed logging
const result = await emailValidator('user@example.com', {
  debug: true,
  checkMx: true,
  checkDisposable: true,
  detailed: true,
});

// Debug logs are written to console as structured JSON
// Perfect for AI-assisted debugging and performance analysis
```

### Production Debug Wrapper

```javascript
import { EmailValidatorDebugger } from './examples/debug-mode.js';

const validator = new EmailValidatorDebugger();
const { result, debug } = await validator.validateWithDebug('test@example.com', {
  checkMx: true,
  checkDisposable: true,
});

console.log(`Validation took ${debug.totalDuration.toFixed(2)}ms`);
console.log(`Memory impact: ${(debug.memoryUsage.delta / 1024).toFixed(2)}KB`);
```

## 🚀 Performance Impact

The debug mode has minimal performance overhead when disabled. When enabled:

- Adds ~1-2ms per validation for logging
- Memory tracking uses native Node.js APIs
- All debug code is excluded when `debug: false` (default)

## 📦 Installation

```bash
npm install node-email-verifier@3.3.0
```

## 🔄 Migration Guide

No breaking changes! Simply update and optionally enable debug mode:

```javascript
// Existing code continues to work
const isValid = await emailValidator('test@example.com');

// Opt-in to debug mode when needed
const isValid = await emailValidator('test@example.com', { debug: true });
```

## 📚 Documentation

- [Debug Mode Example](examples/debug-mode.js) - Complete guide to using debug mode
- [All Examples](examples/) - Six comprehensive examples for different use cases
- [API Documentation](README.md#api) - Full API reference

**Full Changelog**: <https://github.com/jesselpalmer/node-email-verifier/compare/v3.2.0...v3.3.0>

---

## Post-Release Checklist

### 5. Post-Release Verification

- [ ] Verify npm package: `npm view node-email-verifier@3.3.0`
- [ ] Test installation: `npm install node-email-verifier@3.3.0` in a temp directory
- [ ] Update any dependent projects
- [ ] Monitor GitHub issues for any problems
- [ ] Announce release on social media/blog if applicable

## Notes

- This release focuses on developer experience improvements
- No breaking changes - all new features are opt-in
- The Enhanced Disposable Detection feature has been moved to v3.4.0 roadmap
