# Release Notes

## 3.1.1

### Summary

Fixed ESM module import issue that prevented the package from being imported correctly in Node.js
ESM projects.

### Bug Fixes

- **Fixed Import Issue**: Added proper `exports` field in package.json to support ESM imports
  ([#20](https://github.com/jesselpalmer/node-email-verifier/issues/20))
- **Added CommonJS Support**: Added CommonJS wrapper to support both `import` and `require()` syntax
- **Added Import Tests**: Added comprehensive test suite to verify package can be imported correctly
  and prevent regression

### Technical Details

The package was missing the `exports` field in package.json which is required for proper ESM module
resolution in Node.js. This caused import errors when trying to use the package with standard ESM
import syntax.

**Before (broken):**

```javascript
import emailValidator from 'node-email-verifier'; // Error: Cannot find module
```

**After (fixed):**

```javascript
// ES Modules
import emailValidator from 'node-email-verifier'; // ✅ Works correctly

// CommonJS
const emailValidator = require('node-email-verifier'); // ✅ Also works
```

---

## 3.1.0

### Summary

Added opt-in disposable email detection and detailed validation results to enhance email validation
capabilities while maintaining full backward compatibility.

- **Disposable Email Detection**: Block temporary/throwaway email services with 600+ known providers
- **Detailed Validation Results**: Get comprehensive validation information with specific failure
  reasons
- **Zero Breaking Changes**: All new features are opt-in with full backward compatibility
- **Enhanced Test Coverage**: 24 new tests added (79 total) covering new features and edge cases

### Key Features Added

**Disposable Email Detection**: Block temporary email services to improve data quality and prevent
spam registrations with coverage of 600+ providers including 10minutemail, guerrillamail, yopmail,
tempmail, mailinator

**Detailed Validation Results**: Get structured validation information with specific failure reasons
instead of just boolean results for better debugging and user experience

**Performance Optimizations**: Skip expensive MX lookups when disposable emails are detected,
extracted error message constants for consistency, deterministic timeout testing

**Code Quality**: Removed duplicate test helper functions, consistent error messaging, improved test
reliability

### Backwards Compatibility

✅ **All existing JavaScript/TypeScript usage patterns continue to work**  
✅ **Same API and function signatures**  
✅ **No changes to runtime behavior**  
✅ **Adds new features without breaking existing code**

```javascript
// v3.0.0 code works identically in v3.1.0
await emailValidator('test@example.com'); // → boolean
await emailValidator('test@example.com', true); // → boolean
await emailValidator('test@example.com', { checkMx: false }); // → boolean
```

### Usage Examples

```javascript
// Block disposable emails
const isValid = await emailValidator('test@10minutemail.com', {
  checkDisposable: true,
}); // → false

// Get detailed validation results
const result = await emailValidator('test@example.com', {
  detailed: true,
  checkMx: true,
  checkDisposable: true,
});
// Returns: { valid: boolean, email: string, format: {...}, mx: {...}, disposable: {...} }
```
