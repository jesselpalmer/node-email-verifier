# AI Agent Guide for node-email-verifier

This document contains specific guidance for AI agents (like Claude) working on this codebase.

## ⚠️ CRITICAL RULES FOR AI AGENTS

1. **NEVER run `git commit` or `git push` without explicit user permission**
2. **ALWAYS ask the user before making any commits or pushes**
3. **NEVER assume which branch to commit to - always confirm with the user**
4. **DO NOT run any destructive commands (rm -rf, git reset --hard, etc.) without permission**
5. **NEVER include Claude attribution in git commits** - Do not add "🤖 Generated with [Claude
   Code]" or "Co-Authored-By: Claude" to commit messages
6. **ALWAYS use lowercase for commit messages** - Use "feat: add feature" not "feat: Add feature"
7. **KEEP commit messages under 50 characters** - Be concise and clear

## 🏷️ Release Tag Creation

Since AI agents cannot sign tags with GPG keys, for releases:

1. Complete all steps up to tag creation
2. After the release PR is merged, get the merge commit hash
3. Provide the EXACT command for the user to run:

   ```bash
   git tag -s 3.4.0 <merge-commit-hash> -m "release: 3.4.0"
   git push origin 3.4.0
   ```

4. Always include the specific merge commit hash
5. Wait for user confirmation before proceeding with npm publish

## Essential Commands to Run After Changes

Always run these commands after making code changes:

```bash
npm run lint:all      # Run all linters (JS/TS, Markdown, YAML)
npm run format:check  # Check code formatting
npm test             # Run all tests
npm run build        # Build the project
```

For a complete check before committing:

```bash
npm run check        # Runs lint:all, format:check, and test
```

## AI Agent Pain Points & Improvements

### 1. **Missing Type Context in Test Files**

- Test files use `as any` to bypass TypeScript checks for internal testing
- This makes it harder to understand the actual types being used
- **Improvement**: Add type assertions or create test-specific type definitions

### 2. **Ambiguous Build Output**

- The coverage report includes both src/ and dist/ files, making it confusing
- dist/ files show low coverage because they're compiled output
- **Improvement**: Configure Jest to exclude dist/ from coverage reports

### 3. **No Automated Dependency Updates** ✅ FIXED

- Currently requires manual checking with `npm outdated`
- **Improvement**: Add GitHub Actions workflow for automated dependency PRs
- **FIXED**: Added Dependabot configuration with auto-merge for patch/minor updates and weekly
  dependency checks

### 4. **Limited Error Context** ✅ FIXED

- Generic "Unknown error" messages don't help with debugging
- **Improvement**: Add error codes or more descriptive error types
- **FIXED**: Implemented comprehensive error codes system with ErrorCode enum and
  EmailValidationError class

### 5. **Performance Testing Missing** ✅ FIXED

- No benchmarks for disposable domain lookup performance
- With 661 domains, Set lookup is O(1) but initialization could be optimized
- **Improvement**: Add performance benchmarks and consider lazy loading
- **FIXED**: Added comprehensive benchmarks showing 67M+ lookups/sec, 0.3ms init time, no
  optimization needed

### 6. **Integration Test Discovery** ✅ FIXED

- Integration tests are in scripts/ directory, not immediately obvious
- **Improvement**: Move to test/integration/ or document location clearly
- **FIXED**: Moved integration tests to test/integration/ directory for better organization

### 7. **No Pre-commit Hooks** ✅ FIXED

- Easy to forget to run linting/formatting before committing
- **Improvement**: Add husky + lint-staged for automatic pre-commit checks
- **FIXED**: Added husky + lint-staged with pre-commit (auto-fix) and pre-push (tests) hooks

### 8. **Missing API Rate Limiting Documentation** ✅ FIXED

- MX record checks can trigger rate limits on DNS servers
- **Improvement**: Document rate limiting considerations and add retry logic
- **FIXED**: Added comprehensive API_BEST_PRACTICES.md with rate limiting guidance, code examples,
  and production-ready implementation patterns

### 9. **Test Race Condition** ✅ FIXED

- CommonJS test sometimes fails on first run due to build artifacts not being ready
- Running `npm run check` twice usually fixes it
- **Improvement**: Add better synchronization between build and test phases, or increase retry
  timeout
- **FIXED**: Added `waitForFilesToExist` to both ESM and CommonJS import tests with proper file size
  checks

### 10. **AI Debug Mode** 🚀 PLANNED (v3.3.0)

- AI agents need better visibility into validation operations
- **Improvement**: Add `debug: true` option for structured logging
- **PLANNED**: Will include DNS timing, memory usage, and MCP-compatible JSON logs
- See FEATURE_ENHANCEMENTS.md for v3.3.0 release details

## Project Conventions

### File Organization

- Source code: `src/`
- Tests: `test/` (unit tests), `test/integration/` (integration tests)
- Build output: `dist/`
- Documentation: `docs/`, root-level markdown files
- Markdown files: Always use UPPERCASE names (e.g., `README.md`, not `readme.md`)

### Code Style

- Use explicit types, avoid `any` except in tests
- Prefer `const` over `let`
- Use template literals for string concatenation
- Always handle errors explicitly

### Testing Patterns

- Mock external dependencies (DNS lookups)
- Test both success and failure cases
- Use descriptive test names: "should [expected behavior] when [condition]"

### Git Workflow

- Commit messages: "type: description" (e.g., "fix: correct timeout handling")
- Always run `npm run check` before committing
- Don't commit dist/ files (they're built automatically)

**IMPORTANT: NEVER run `git commit` or `git push` automatically without explicit user permission.
Always ask the user before committing or pushing changes.**

## Known Quirks

1. **CommonJS Compatibility**: The project uses a build script to generate a CommonJS wrapper. This
   is intentional for backward compatibility.

2. **Test Environment**: Tests use `--experimental-vm-modules` flag for ESM support in Jest.

3. **Timeout Testing**: Timeout tests use small values (1ms) which might be flaky on slow systems.

4. **Type Exports**: Some internal types (like `InternalEmailValidatorOptions`) are not exported,
   making extension harder.

5. **Race Condition in Tests**: The CommonJS test sometimes fails on first run because the build
   artifacts aren't ready. Running `npm run check` twice usually fixes it. This is due to a timing
   issue between the build process and test execution.

## Suggested Improvements for AI Agents

1. **Add Structured Logging**

   ```typescript
   // Instead of console.error
   logger.error('DNS_LOOKUP_FAILED', { domain, error: error.message });
   ```

2. **Export More Types**

   ```typescript
   export type MxRecord = { exchange: string; priority: number };
   export type DnsResolver = (hostname: string) => Promise<MxRecord[]>;
   ```

3. **Add Debug Mode**

   ```typescript
   export interface EmailValidatorOptions {
     debug?: boolean; // Log internal operations
   }
   ```

4. **Improve Test Mocking**

   ```typescript
   // Create proper test types instead of using 'as any'
   type TestOptions = EmailValidatorOptions & {
     _resolveMx?: DnsResolver;
   };
   ```

5. **Add Performance Metrics**

   ```typescript
   const result = await emailValidator(email, {
     detailed: true,
     metrics: true, // Include timing information
   });
   ```

## Quick Reference

### Run specific tests

```bash
npm test -- index.test.ts     # Run specific test file
npm test -- --coverage       # Run with coverage
```

### Check specific linters

```bash
npm run lint                 # JS/TS only
npm run lint:md             # Markdown only
npm run lint:yaml           # YAML only
```

### Debug build issues

```bash
npm run build               # Full build
node scripts/build-cjs.js   # Just CommonJS wrapper
```

### Version bumping

```bash
npm version patch           # 3.1.3 -> 3.1.4
npm version minor           # 3.1.3 -> 3.2.0
npm version major           # 3.1.3 -> 4.0.0
```

Remember: Always validate changes work in both ESM and CommonJS environments!
