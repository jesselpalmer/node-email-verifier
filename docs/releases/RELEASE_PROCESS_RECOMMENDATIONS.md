# Release Process Recommendations

Based on my experience with the v3.3.0 release, here are some recommendations for improving the
release process:

## 1. Add Pre-flight Checks to Release Notes Template

Before starting any release, add these checks:

```bash
# Ensure we're starting from a clean state
git status  # Should show "nothing to commit, working tree clean"
git branch --show-current  # Should show "main"
git pull origin main  # Ensure we have latest changes
```

## 2. Add npm Authentication Check

Before the npm publish step, add:

```bash
# Verify npm authentication
npm whoami
# If not logged in: npm login
```

## 3. Create a Release Checklist Template

Consider adding a template file `docs/releases/RELEASE_TEMPLATE.md` that can be copied for each
release. This ensures consistency.

## 4. Add Rollback Instructions

Include a section on what to do if something goes wrong:

```markdown
### If Release Fails After Tag Creation

1. Delete the tag locally: `git tag -d vX.Y.Z`
2. Delete the tag remotely: `git push origin --delete vX.Y.Z`
3. Fix the issue
4. Start over from step 3 (Create and Push Tag)

### If npm Publish Fails

1. Check the error message
2. If version exists, bump patch version
3. Update CHANGELOG.md with new version
4. Continue from step 2 (Create release commit)
```

## 5. Add Version Verification Step

After npm publish, add:

```bash
# Verify the package was published correctly
npm view node-email-verifier@3.3.0

# Quick smoke test
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install node-email-verifier@3.3.0
node -e "const validator = require('node-email-verifier'); console.log('Install successful');"
cd - && rm -rf /tmp/test-install
```

## 6. Branch Protection Recommendations

Consider documenting that the main branch should have:

- Require pull request reviews before merging
- Require status checks to pass before merging
- Include administrators in restrictions

## 7. Automate Where Possible

Consider creating npm scripts for common tasks:

```json
{
  "scripts": {
    "release:check": "npm run check && npm run build && git status",
    "release:test-install": "npm pack && mkdir -p tmp && npm install ./node-email-verifier-*.tgz --prefix tmp && rm -rf tmp *.tgz"
  }
}
```

## 8. Document Common Pitfalls

Based on issues encountered:

### Git Branch Issues

- **Problem**: Creating release branch from outdated base
- **Solution**: Always run `git pull origin main` before creating release branch

### PR Contains Old Commits

- **Problem**: Release branch includes commits already on main
- **Solution**: Create fresh branch from latest main, cherry-pick only needed commits

### Pre-commit Hooks Modifying Files

- **Problem**: Commits fail due to pre-commit hooks changing files
- **Solution**: After hooks run, review changes and amend commit if needed

## 9. Consider a Release Script

For consistency, consider a simple release script that enforces the process:

```bash
#!/bin/bash
# scripts/prepare-release.sh

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/prepare-release.sh X.Y.Z"
  exit 1
fi

# Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory not clean"
  exit 1
fi

# Ensure on main branch
if [ "$(git branch --show-current)" != "main" ]; then
  echo "Error: Not on main branch"
  exit 1
fi

echo "Preparing release v$VERSION..."
# ... rest of the release steps
```

## 10. AI-Specific Considerations

When an AI agent (like me) is performing releases:

1. **Always show command output** - Don't assume commands succeeded
2. **Read pre-commit hook output** - These often contain important formatting changes
3. **Verify file contents after edits** - Linters may modify files
4. **Check git status frequently** - Understand what's staged vs. modified
5. **Ask for clarification on version bumps** - Don't guess if it should be patch/minor/major

## Summary

The current process is good, but could benefit from:

- More pre-flight checks
- Rollback procedures
- Automation opportunities
- Better error handling documentation

These improvements would make releases more reliable and easier to perform correctly every time.
