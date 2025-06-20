# Contributing to Node Email Verifier

Thank you for your interest in contributing to Node Email Verifier! This guide will help you get
started with development.

## Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/node-email-verifier.git
   cd node-email-verifier
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

## Development Workflow

### Code Quality Standards

This project maintains high code quality standards using multiple tools:

- **ESLint** - JavaScript/TypeScript linting
- **Markdownlint** - Markdown file linting
- **yaml-lint** - YAML file validation
- **Prettier** - Code formatting for all file types
- **Jest** - Testing framework

### Available Scripts

#### Building

- `npm run build` - Compile TypeScript and generate CommonJS wrapper

#### Testing

- `npm test` - Run all tests
- `npm run test:integration` - Run integration tests

#### Linting

- `npm run lint` - Lint JavaScript/TypeScript files
- `npm run lint:fix` - Auto-fix JS/TS linting issues
- `npm run lint:md` - Lint Markdown files
- `npm run lint:md:fix` - Auto-fix Markdown issues
- `npm run lint:yaml` - Validate YAML files
- `npm run lint:all` - Run all linters

#### Formatting

- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are properly formatted

#### Combined Commands

- `npm run check` - Run all linters, formatting check, and tests
- `npm run precommit` - Auto-fix issues and run tests (recommended before committing)

### Before Submitting a Pull Request

1. **Run the full check**

   ```bash
   npm run check
   ```

   This ensures all code quality standards are met.

2. **Fix any issues**

   ```bash
   npm run precommit
   ```

   This will attempt to auto-fix linting issues and format your code.

3. **Ensure all tests pass**

   ```bash
   npm test
   ```

4. **Update documentation** if you've added new features or changed APIs

### Commit Message Guidelines

Follow conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Build process or auxiliary tool changes

Examples:

```text
feat: add support for custom DNS servers
fix: handle timeout errors gracefully
docs: update API documentation for new options
```

### Code Style Guide

#### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules (enforced automatically)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

#### Markdown

- Use proper heading hierarchy
- Add language identifiers to code blocks
- Keep line length reasonable (no hard limit)
- Use blank lines around headings and lists

#### YAML

- Use 2-space indentation
- Quote strings when necessary
- Keep files valid and well-structured

### Testing Guidelines

1. **Write tests for new features**

   - Add tests in the `test/` directory
   - Follow existing test patterns
   - Aim for high code coverage

2. **Test types**

   - Unit tests for individual functions
   - Integration tests for module interactions
   - Cross-platform tests (via GitHub Actions)

3. **Running tests locally**

   ```bash
   npm test
   ```

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Update type definitions if APIs change
- Document breaking changes clearly

### Getting Help

If you have questions:

1. Check existing issues and pull requests
2. Open a new issue for discussion
3. Ask in pull request comments

Thank you for contributing!
