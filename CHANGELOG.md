# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.4.1] - 2025-01-15

### Fixed

- Fixed missing dist files in npm package by adding .npmignore file (#65)
  - dist/index.js and dist/index.d.ts were excluded from npm package due to .gitignore
  - Added .npmignore to ensure dist files are included while keeping them out of git

## [3.4.0] - 2025-06-24

### Added

- MX Record Caching with LRU Eviction Strategy (PR #51):
  - TTL-based caching with configurable default TTL (5 minutes) and max cache size (1000 entries)
  - LRU (Least Recently Used) eviction strategy that keeps frequently accessed domains in memory
  - Cache statistics tracking (hits, misses, evictions, hit rate) included in detailed validation
    results
  - Global cache management with flush, delete, and reset statistics methods
  - **7.7x performance improvement** with realistic DNS latency (25ms)
  - **87%+ cache hit rate** in typical usage patterns with mixed domain popularity
  - **872 DNS lookups avoided** out of 1000 requests (87.2% reduction)
  - Automatic periodic cleanup of expired entries to prevent memory accumulation
  - Comprehensive performance benchmarks demonstrating real-world improvements
- Enhanced TypeScript Support (PR #57):
  - Export `EmailValidationError` class and `isEmailValidationError` helper function for better
    error handling
  - All major interfaces and types now exported: `MxRecord`, `ValidationResult`,
    `EmailValidatorOptions`, `CacheStatistics`, `MxCacheOptions`
  - Comprehensive JSDoc documentation on all public APIs

## [3.3.0] - 2025-06-22

### Added

- AI Debug Mode (`debug: true` option) for enhanced debugging and observability:
  - Structured JSON logging with MCP-compatible format
  - Performance timing for each validation phase
  - Memory usage tracking (heap, RSS, external)
  - Detailed error logging with stack traces
  - Debug mode example demonstrating production usage patterns
- Examples directory with comprehensive usage examples:
  - Basic validation patterns (`examples/basic-validation.js`)
  - TypeScript integration with full type support (`examples/typescript-usage.ts`)
  - Bulk email validation strategies (`examples/bulk-validation.js`)
  - Error handling with error codes (`examples/error-handling.js`)
  - CommonJS compatibility examples (`examples/commonjs-usage.cjs`)
  - Debug mode usage and production wrapper (`examples/debug-mode.js`)

## [3.2.0] - 2025-06-21

### Added

- Comprehensive error codes system with `ErrorCode` enum for programmatic error handling
- Custom `EmailValidationError` class for better error context
- Error codes included in detailed validation results (`errorCode` field)
- Top-level `errorCode` in ValidationResult for quick error access
- Automated dependency management with Dependabot configuration
- Auto-merge workflow for Dependabot PRs (patch and minor updates)
- Weekly dependency check workflow that creates GitHub issues
- GitHub CodeQL security scanning for JavaScript/TypeScript
- Security policy (SECURITY.md) with vulnerability reporting guidelines
- AI workflow documentation (docs/AI_WORKFLOW.md) for AI agent interactions
- Better test synchronization with file size checks in `waitForFilesToExist`
- Performance benchmarks for disposable domain lookups (`npm run benchmark`)
- Performance documentation (docs/PERFORMANCE.md) with detailed analysis
- Pre-commit hooks with husky and lint-staged for automatic code quality checks
- Pre-push hook to run tests before pushing
- API best practices documentation (docs/API_BEST_PRACTICES.md) with rate limiting guidance
- Git hooks documentation in README
- Moved integration tests to `test/integration/` directory for better organization

### Changed

- Error messages now use centralized `ErrorMessages` mapping
- Improved test coverage for error scenarios
- Updated README with comprehensive error handling examples
- Updated CLAUDE.md to mark completed improvements

### Fixed

- Path issues in integration tests after directory reorganization
- Race condition in CommonJS import tests by correcting retry parameter order
- Test flakiness by adding proper file content validation

## [3.1.3] - 2025-06-20

### Fixed

- Fixed curl command example in README.md by adding missing Content-Type header

## [3.1.2] - 2025-06-20

### Changed

- Updated README.md to include information about ValidKit hosted API service

## [3.1.1] - 2025-06-20

### Fixed

- Fixed ESM module import issue by adding proper `exports` field in package.json
  ([#20](https://github.com/jesselpalmer/node-email-verifier/issues/20))
- Added CommonJS compatibility through automatic wrapper generation
- Fixed Windows CI multiline echo commands using heredoc syntax
- Ensured dist directory is properly included in npm packages with `files` field

### Added

- CommonJS wrapper (`dist/index.cjs`) for `require()` support
- Comprehensive import tests for both ESM and CommonJS
- Build script with error handling for wrapper generation
- Documentation for dual module system support
- Examples for handling promises in CommonJS
- Markdown linting with markdownlint-cli2 and auto-fix capabilities
- YAML linting with custom validation script using async I/O
- Integration tests for CommonJS, ESM, and TypeScript usage
- `npm run check` command to run all quality checks
- Comprehensive CONTRIBUTING.md guide for contributors
- `lint:all`, `lint:md`, `lint:md:fix`, and `lint:yaml` npm scripts

### Changed

- Build process now generates CommonJS wrapper automatically
- Enhanced documentation with both ESM and CommonJS usage examples
- CI workflows now use `npm ci` for faster, more reliable builds
- Improved cross-platform compatibility in GitHub Actions
- Optimized YAML linting with path segment checking

## [3.1.0] - 2025-06-15

### Added

- Disposable email detection with 600+ known providers
- Detailed validation results with specific failure reasons
- Performance optimizations for disposable email checking
- 24 new tests for comprehensive coverage

### Changed

- All new features are opt-in to maintain backward compatibility
- Enhanced error messaging consistency

## [3.0.0] - 2025-06-14

### Changed

- **BREAKING**: Migrated from CommonJS to ES Modules
- **BREAKING**: Requires Node.js 18.0.0 or higher
- Converted entire codebase to TypeScript
- Modernized build and test infrastructure

### Added

- Full TypeScript support with type definitions
- ES Module syntax throughout
- Modern development tooling

## [2.0.0] - 2024-08-20

### Added

- Custom timeout settings for email validation process
- Support for options object with `checkMx` and `timeout` parameters
- Maintained backward compatibility with boolean options

### Changed

- Enhanced email validation function to handle options as an object
- Improved flexibility in configuring validation behavior

### Contributors

- @rkitover - Added support for custom timeout (#8)

## [1.1.1] - 2024-04-12

### Fixed

- Bug fixes and improvements

## [1.1.0] - 2024-04-12

### Added

- Parameter to disable MX records check

## [1.0.1] - 2024-02-10

### Changed

- Updated dependencies

## [1.0.0] - 2023-11-12

### Added

- Initial release
- RFC 5322 email format validation
- MX record checking to verify domain can receive emails
- Simple promise-based API
- Minimal dependencies
