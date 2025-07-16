# Release Notes for v3.4.1

## Overview

This is a patch release that fixes a critical issue where the dist files were missing from the npm
package in version 3.4.0.

## What's Fixed

### Missing dist files in npm package (#65)

- **Issue**: The 3.4.0 release was missing `dist/index.js` and `dist/index.d.ts` files, causing
  TypeScript and module resolution issues
- **Cause**: The `dist/` directory was in `.gitignore` and npm was using it as the ignore file since
  no `.npmignore` existed
- **Solution**: Added `.npmignore` file to explicitly control what gets published to npm while
  keeping `dist/` out of git

## Pre-release Checklist

- [x] All tests passing locally
- [x] Build completes successfully
- [x] `.npmignore` file created and configured
- [x] Version bumped to 3.4.1
- [x] CHANGELOG.md updated
- [x] Release notes created

## Release Instructions

1. Ensure you're on the release/3.4.1 branch
2. Run all checks: `npm run check`
3. Build the project: `npm run build`
4. Verify dist files exist
5. Commit all changes
6. Create PR to main branch
7. After merge, create signed tag on merge commit
8. Publish to npm
9. Create GitHub release

## GitHub Release Notes

### 🐛 Bug Fix Release

This patch release fixes a critical packaging issue from v3.4.0.

#### What's Fixed

- **Fixed missing dist files in npm package** (#65)
  - The npm package now correctly includes `dist/index.js` and `dist/index.d.ts`
  - Added `.npmignore` to ensure proper file inclusion in published packages
  - No code changes, only packaging configuration

#### For Users Affected by v3.4.0

If you're experiencing TypeScript errors or module resolution issues with v3.4.0, please upgrade to
v3.4.1:

```bash
npm install node-email-verifier@3.4.1
```

## Verification Steps

After publishing, verify the fix:

```bash
# Check package contents
npm view node-email-verifier@3.4.1 dist.tarball | xargs curl -s | tar -tz | grep dist/

# Should show:
# dist/index.js
# dist/index.d.ts
# dist/index.cjs
# ... and other dist files
```

## Notes

- This is a packaging fix only, no code changes
- Users on v3.3.0 or earlier are not affected
- v3.4.0 should be deprecated after this release
