# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive error codes system with `ErrorCode` enum for programmatic error handling
- Custom `EmailValidationError` class for better error context
- Error codes included in detailed validation results (`errorCode` field)
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
- Moved integration tests to `test/integration/` directory for better organization
- API best practices documentation (docs/API_BEST_PRACTICES.md) with rate limiting guidance

### Fixed

- Race condition in CommonJS import tests by correcting retry parameter order
- Test flakiness by adding proper file content validation

### Changed

- Error messages now use centralized `ErrorMessages` mapping
- Improved test coverage for error scenarios
- Updated CLAUDE.md to mark completed improvements

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
