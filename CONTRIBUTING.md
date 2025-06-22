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

### Pre-commit Hooks

This project uses [husky](https://typicode.github.io/husky/) and
[lint-staged](https://github.com/okonet/lint-staged) to automatically run checks before commits and
pushes:

#### Automatic Checks

- **Pre-commit**: Runs lint-staged to automatically:
  - Fix ESLint issues in JS/TS files
  - Format all files with Prettier
  - Fix Markdown linting issues
  - Validate YAML files
- **Pre-push**: Runs the full test suite

The hooks are automatically installed when you run `npm install`.

#### Bypassing Hooks

If you need to bypass a hook in an emergency:

```bash
# Skip pre-commit hook
git commit --no-verify -m "Emergency fix"

# Skip pre-push hook
git push --no-verify
```

**Note**: Please only bypass hooks when absolutely necessary and ensure your code passes all checks
before merging.

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

Follow conventional commit format with these requirements:

- **Keep messages under 50 characters**
- **Use all lowercase** (including after the colon)
- **Be concise and clear**

Types:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Build process or auxiliary tool changes

Examples:

```text
feat: add support for custom dns servers
fix: handle timeout errors gracefully
docs: update api documentation
chore: bump dependencies to latest versions
```

Bad examples (too long or wrong case):

```text
feat: Add support for custom DNS servers ❌ (uppercase)
fix: Handle timeout errors gracefully in the DNS resolution module ❌ (too long)
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
- Add or update examples in the `examples/` directory if your changes affect usage patterns

### Getting Help

If you have questions:

1. Check existing issues and pull requests
2. Open a new issue for discussion
3. Ask in pull request comments

## Automated Dependency Management

This project uses automated dependency management to keep dependencies up to date and secure:

### Dependabot Configuration

- **Frequency**: Weekly checks every Monday at 4:00 AM UTC
- **Auto-merge**: Patch and minor updates are automatically merged if all tests pass
- **Manual review**: Major version updates require manual review
- **Grouped updates**: Development dependencies are grouped together

### Security Scanning

- **Weekly vulnerability checks**: Automated npm audit runs weekly
- **Issue creation**: Opens GitHub issues for outdated dependencies or vulnerabilities
- **Immediate alerts**: Security vulnerabilities trigger immediate Dependabot PRs

### Manual Dependency Checks

To manually check for outdated dependencies:

```bash
npm outdated      # Show outdated packages
npm audit        # Check for security vulnerabilities
npm audit fix    # Auto-fix vulnerabilities (be careful with breaking changes)
```

### Handling Dependabot PRs

1. **Patch/Minor updates**: Usually safe to merge after CI passes
2. **Major updates**: Review breaking changes in the changelog
3. **Security updates**: Prioritize and merge quickly after testing
4. **Failed CI**: Investigate and fix issues before merging

## Roadmap and Feature Planning

When proposing new features or working on improvements, please add them to
`FEATURE_ENHANCEMENTS.md`. Keep the roadmap document updated when completing features or discovering
new requirements.

Thank you for contributing!
