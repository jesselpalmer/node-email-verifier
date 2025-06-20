# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2025-06-19

### Fixed

- Fixed ESM module import issue by adding proper `exports` field in package.json
  ([#20](https://github.com/jesselpalmer/node-email-verifier/issues/20))
- Added CommonJS compatibility through automatic wrapper generation

### Added

- CommonJS wrapper (`dist/index.cjs`) for `require()` support
- Comprehensive import tests for both ESM and CommonJS
- Build script with error handling for wrapper generation
- Documentation for dual module system support
- Examples for handling promises in CommonJS

### Changed

- Build process now generates CommonJS wrapper automatically
- Enhanced documentation with both ESM and CommonJS usage examples

## [3.1.0] - 2025-06-14

### Added

- Disposable email detection with 600+ known providers
- Detailed validation results with specific failure reasons
- Performance optimizations for disposable email checking
- 24 new tests for comprehensive coverage

### Changed

- All new features are opt-in to maintain backward compatibility
- Enhanced error messaging consistency

## [3.0.0] - 2025-06-13

### Changed

- **BREAKING**: Migrated from CommonJS to ES Modules
- **BREAKING**: Requires Node.js 18.0.0 or higher
- Converted entire codebase to TypeScript
- Modernized build and test infrastructure

### Added

- Full TypeScript support with type definitions
- ES Module syntax throughout
- Modern development tooling

## [2.0.0] - Previous Version

### Note

- Last version with CommonJS support by default
- Users on this version should upgrade to 3.1.1 for better compatibility
