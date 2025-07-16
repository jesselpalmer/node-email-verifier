# Release Process for node-email-verifier

This document outlines the standard process for releasing new versions of node-email-verifier.

## 🛡️ Automatic Safeguards

The project has multiple layers of protection to prevent broken releases:

### Local Safeguards (Can't be bypassed)

1. **`npm publish` is protected** by the `prepublishOnly` hook:

   - Automatically builds the project
   - Runs full test suite (270+ tests)
   - Validates package contents
   - Tests package installation
   - **Publishing is blocked if any check fails**

2. **Git pushes are protected** by the `pre-push` hook:
   - Runs tests on every push
   - Additional package validation on main/release branches

### CI/CD Safeguards

1. **Package Check workflow** (GitHub Actions):

   - Validates npm package contents on every PR
   - Tests ESM, CommonJS, and TypeScript compatibility
   - Enforces 1MB package size limit

2. **Node.js CI workflow**:
   - Tests on Node.js 18.x, 20.x, and 22.x
   - Runs on all PRs and pushes to main

### Why These Safeguards Exist

The v3.4.0 release was missing dist files because:

- No `.npmignore` existed, so npm used `.gitignore`
- `dist/` was in `.gitignore`, excluding it from the package
- No validation caught this before publishing

Now, even if you try to skip checks:

- `npm publish --force` still runs `prepublishOnly`
- The hooks will catch missing dist files
- Invalid packages are blocked from publishing

## Pre-Release Requirements

### Prerequisites

- Maintainer access to the npm package
- GPG key set up for signing tags (see [GPG Setup Guide](docs/GPG_SETUP.md))
- Or use `-a` for annotated (unsigned) tags if GPG is not available
- GitHub repository write access
- npm authentication: `npm whoami` (should show your username)
- Two-factor authentication ready for npm (have your authenticator app handy)

### Pre-Flight Checks

Before starting any release:

```bash
# Verify clean working directory
git status  # Should show "nothing to commit, working tree clean"

# Ensure on main branch with latest changes
git checkout main
git pull origin main

# Check current version
npm version --json | grep node-email-verifier

# Check for outdated dependencies
npm outdated  # Review but don't update during release

# Run security audit
npm audit

# Run all quality checks
npm run check  # Runs lint:all, format:check, and test

# Clean and rebuild
rm -rf dist/
npm run build

# Test both ESM and CommonJS builds
node -e "import('./dist/index.js').then(() => console.log('✓ ESM build works'))"
node -e "require('./dist/index.cjs'); console.log('✓ CommonJS build works')"

# CRITICAL: Verify npm package contents
npm run check:package

# Test package installation (simulates CI environment)
npm run test:package-install
```

## Release Process

### 1. Plan the Release

1. Review pending changes and PRs
2. Determine version bump type:

   - `patch` (3.3.0 → 3.3.1): Bug fixes only
   - `minor` (3.3.0 → 3.4.0): New features, backward compatible
   - `major` (3.3.0 → 4.0.0): Breaking changes

3. Update FEATURE_ENHANCEMENTS.md if needed (move features to appropriate version)

### 2. Create Release Branch

```bash
# Ensure branch doesn't already exist
if git branch -r | grep -q release/X.Y.Z; then
  echo "Branch already exists!"
  exit 1
fi

# Create a new release branch from main
git checkout -b release/X.Y.Z

# Example for 3.3.0
git checkout -b release/3.3.0
```

### 3. Update Version and Documentation

#### Update package.json

```bash
npm version minor --no-git-tag-version  # or major/patch
```

#### Update CHANGELOG.md

Add a new entry at the top following this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New features

### Changed

- Modified functionality

### Fixed

- Bug fixes

### Removed

- Deprecated features removed
```

#### Create Release Notes

```bash
# Create release notes file
touch docs/releases/RELEASE_NOTES_X.Y.Z.md
```

Use `docs/releases/RELEASE_NOTES_3.3.0.md` as a template. Include:

- Pre-release checklist
- Step-by-step release instructions
- Formatted release notes for GitHub
- Test plans for verification

#### Update CLAUDE.md (if needed)

If the release includes new features or changes that affect AI agents:

- Update the Essential Commands section
- Add any new pain points discovered
- Document new conventions or patterns

### 4. Commit and Push Changes

```bash
# Stage all changes
git add package.json package-lock.json CHANGELOG.md docs/releases/RELEASE_NOTES_X.Y.Z.md

# Commit with conventional message
git commit -m "chore: prepare for X.Y.Z release"

# Push the release branch
git push origin release/X.Y.Z
```

### 5. Create Pull Request

1. Go to GitHub and create a PR from `release/X.Y.Z` to `main`
2. Title: "Release X.Y.Z"
3. Description: Summary of changes
4. Request review if needed
5. Merge the PR using merge commit (preserves release history)

**Important:** All code changes must go through pull requests. No direct commits to main branch.

### 6. Create Release Tag

After PR is merged:

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Get the merge commit hash
MERGE_COMMIT=$(git rev-parse HEAD)
```

**For AI-Assisted Releases:** The AI will provide you with the exact commands to create a signed tag
on the merge commit:

```bash
# Example (AI will provide specific merge commit hash):
git tag -s X.Y.Z abc123f -m "release: X.Y.Z"
git push origin X.Y.Z
```

**For Manual Releases:**

```bash
# Create signed tag on the merge commit (requires GPG key)
git tag -s X.Y.Z $MERGE_COMMIT -m "release: X.Y.Z"

# OR create annotated tag (no GPG required)
git tag -a X.Y.Z $MERGE_COMMIT -m "release: X.Y.Z"

# Push tag
git push origin X.Y.Z
```

### 7. Publish to npm

```bash
# Final verification
npm run check

# Run integration tests
npm run test:integration

# Preview what will be published
npm pack --dry-run

# Publish to npm (may prompt for 2FA code)
npm publish

# Verify publication
npm view node-email-verifier@X.Y.Z

# Quick smoke test
cd /tmp && npm init -y --silent
npm install node-email-verifier@X.Y.Z
node -e "const v = require('node-email-verifier'); console.log('✓ Install successful')"
cd - && rm -rf /tmp/package.json /tmp/package-lock.json /tmp/node_modules
```

### 8. Create GitHub Release

1. Go to <https://github.com/jesselpalmer/node-email-verifier/releases/new>
2. Select tag: `X.Y.Z`
3. Title: `X.Y.Z`
4. Description: Use formatted release notes from `docs/releases/RELEASE_NOTES_X.Y.Z.md`
5. Publish release

### 9. Verify Everything Works

```bash
# Test the published package in a fresh environment
mkdir /tmp/test-release && cd /tmp/test-release
npm init -y
npm install node-email-verifier@X.Y.Z

# Test ESM import
echo 'import emailValidator from "node-email-verifier"; console.log(await emailValidator("test@example.com"))' > test.mjs
node test.mjs

# Test CommonJS require
echo 'const emailValidator = require("node-email-verifier"); emailValidator("test@example.com").then(console.log)' > test.js
node test.js

# Cleanup
cd - && rm -rf /tmp/test-release
```

### 10. Post-Release Tasks

- [ ] Verify npm package: `npm view node-email-verifier@latest`
- [ ] Test installation in a fresh project
- [ ] Update any dependent projects
- [ ] Clean up release branch: `git push origin --delete release/X.Y.Z`
- [ ] Announce release if needed (Twitter, Discord, etc.)

## Beta and Pre-release Versions

For beta or pre-release versions:

```bash
# Version bump for beta
npm version 3.4.0-beta.1 --no-git-tag-version

# Publish with beta tag
npm publish --tag beta

# Users install with
npm install node-email-verifier@beta
```

## Common Issues and Solutions

### npm publish fails

- **"Working directory not clean"**: Run `git stash` to save changes temporarily
- **"Cannot publish over existing version"**: Version already exists, bump to next patch
- **"npm ERR! 403"**: Not authenticated, run `npm login`
- **"npm ERR! 402"**: Payment required - check npm account status
- **"npm ERR! code EOTP"**: Two-factor auth required - enter code from authenticator app
- **Build errors**: Try `npm cache clean --force` and rebuild

### Tag already exists

```bash
# Delete local tag
git tag -d X.Y.Z

# Delete remote tag (if pushed)
git push origin --delete X.Y.Z

# Recreate tag (signed)
git tag -s X.Y.Z -m "release: X.Y.Z"

# OR recreate tag (unsigned)
git tag -a X.Y.Z -m "release: X.Y.Z"
```

### Build failures

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build artifacts: `npm run clean && npm run build`
- Check Node.js version: Ensure using supported version

### Release rollback

If a critical issue is found after release:

1. **Never** delete published npm packages or GitHub releases
2. Create a new patch version with the fix
3. Document the issue in the new version's changelog
4. Consider using npm deprecate for seriously broken versions

### Recovery from Failed Release

If the release process fails partway through:

1. **After version bump but before publish**: Reset to previous commit
2. **After npm publish but before GitHub release**: Create GitHub release immediately
3. **After tag creation fails**: Delete and recreate tag
4. **If CHANGELOG has conflicts**: Manually resolve and update release notes

### Coordinating Multiple Maintainers

- Use a release schedule (e.g., monthly releases)
- Communicate in project chat/issues before starting
- Only one person should execute the release process
- Use release tracking issue for coordination

## Best Practices

### Timing

- Avoid releases on Fridays or before holidays
- Release during US business hours (9 AM - 3 PM PT) for better support availability
- Allow time for post-release monitoring

### Communication

- Document all changes clearly in CHANGELOG.md
- Use semantic versioning strictly
- Write clear, descriptive commit messages

### Quality

- Never skip the `npm run check` step
- Test the published package before announcing
- Keep release commits atomic and focused

## Automation Opportunities

Consider adding these npm scripts to streamline the process:

```json
{
  "scripts": {
    "release:patch": "npm version patch && npm run release:prepare",
    "release:minor": "npm version minor && npm run release:prepare",
    "release:major": "npm version major && npm run release:prepare",
    "release:prepare": "npm run check && npm run build",
    "release:verify": "npm pack --dry-run && npm run test"
  }
}
```

## AI Agent Guidelines

When assisting with releases:

1. **Always verify branch state** before making changes
2. **Never skip quality checks** - run `npm run check` frequently
3. **Watch for pre-commit hooks** - they may modify files
4. **Read error messages carefully** - npm and git provide helpful details
5. **Ask for clarification** on version bumps or unclear requirements
6. **Check git status frequently** to understand current state
7. **Never auto-commit** without explicit user permission
8. **Use lowercase commit messages** - "feat:" not "Feat:"
9. **Keep commit messages under 50 characters** - Be concise
10. **Avoid emoji** unless specifically requested
11. **Test commands** before suggesting them to users
12. **Check CLAUDE.md** for any updates needed for new features
13. **Verify dist/ is clean** before building to avoid stale files
14. **Run integration tests** - they're in test/integration/
15. **Be aware of pre-commit hooks** that may auto-fix files

### Tag Creation Process for AI

Since AI agents cannot sign tags with GPG keys:

1. **Complete all release steps** up to tag creation
2. **Identify the merge commit hash** from the merged PR
3. **Provide the exact command** for the maintainer to run:

   ```bash
   git tag -s X.Y.Z <merge-commit-hash> -m "release: X.Y.Z"
   git push origin X.Y.Z
   ```

4. **Include the specific merge commit hash** to ensure the tag is created on the correct commit
5. **Wait for confirmation** before proceeding with npm publish

## Additional Resources

- [npm Publishing Documentation](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub Release Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- See [CONTRIBUTING.md](CONTRIBUTING.md) for versioning and commit standards

---

For specific release examples, see the `docs/releases/` directory.
