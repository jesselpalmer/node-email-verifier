# Release Process for node-email-verifier

This document outlines the standard process for releasing new versions of node-email-verifier.

## Pre-Release Requirements

### Prerequisites

- Maintainer access to the npm package
- GPG key set up for signing tags
- GitHub repository write access
- npm authentication: `npm whoami` (should show your username)

### Pre-Flight Checks

Before starting any release:

```bash
# Verify clean working directory
git status  # Should show "nothing to commit, working tree clean"

# Ensure on main branch with latest changes
git checkout main
git pull origin main

# Run all quality checks
npm run check  # Runs lint:all, format:check, and test

# Build the project
npm run build
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
# Create a new release branch
git checkout -b release/X.Y.Z

# Example for v3.3.0
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

### 4. Commit and Push Changes

```bash
# Stage all changes
git add package.json package-lock.json CHANGELOG.md docs/releases/

# Commit with conventional message
git commit -m "chore: prepare for vX.Y.Z release"

# Push the release branch
git push origin release/X.Y.Z
```

### 5. Create Pull Request

1. Go to GitHub and create a PR from `release/X.Y.Z` to `main`
2. Title: "Release vX.Y.Z"
3. Description: Summary of changes
4. Request review if needed
5. Merge the PR (squash or merge commit based on preference)

### 6. Create Release Commit and Tag

After PR is merged:

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Create release commit
git commit --allow-empty -m "release: X.Y.Z"
git push origin main

# Create signed tag
git tag -s vX.Y.Z -m "Release vX.Y.Z"

# Push tag
git push origin vX.Y.Z
```

### 7. Publish to npm

```bash
# Final verification
npm run check

# Publish to npm
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
2. Select tag: `vX.Y.Z`
3. Title: `vX.Y.Z`
4. Description: Use formatted release notes from `docs/releases/RELEASE_NOTES_X.Y.Z.md`
5. Publish release

### 9. Post-Release Tasks

- [ ] Verify npm package: `npm view node-email-verifier@latest`
- [ ] Test installation in a fresh project
- [ ] Update any dependent projects
- [ ] Clean up release branch: `git push origin --delete release/X.Y.Z`
- [ ] Announce release if needed (Twitter, Discord, etc.)

## Common Issues and Solutions

### npm publish fails

- **"Working directory not clean"**: Run `git stash` to save changes temporarily
- **"Cannot publish over existing version"**: Version already exists, bump to next patch
- **"npm ERR! 403"**: Not authenticated, run `npm login`
- **"npm ERR! 402"**: Payment required - check npm account status

### Tag already exists

```bash
# Delete local tag
git tag -d vX.Y.Z

# Delete remote tag (if pushed)
git push origin --delete vX.Y.Z

# Recreate tag
git tag -s vX.Y.Z -m "Release vX.Y.Z"
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

## Best Practices

### Timing

- Avoid releases on Fridays or before holidays
- Release during business hours for better support availability
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
9. **Avoid emoji** unless specifically requested
10. **Test commands** before suggesting them to users

## Version History

- v1.0.0: Initial release process
- v2.0.0: Added automated checks and npm scripts
- v3.0.0: Improved documentation and AI guidelines

---

For specific release examples, see the `docs/releases/` directory.
