# Integration Testing

This package includes comprehensive integration testing to ensure compatibility across different
environments.

## Automated CI/CD Testing

The `.github/workflows/integration-tests.yml` workflow runs on:

- **Push** to main or develop branches
- **Pull requests** to main
- **Manual dispatch** (can be triggered from GitHub Actions tab)

### Test Matrix

The workflow tests across:

- **Operating Systems**: Ubuntu, macOS, Windows
- **Node.js versions**: 18.x, 20.x, 22.x
- **Module systems**: CommonJS and ES Modules
- **TypeScript**: Compilation and type checking

### What's Tested

1. **CommonJS compatibility** - `require()` works correctly
2. **ES Module compatibility** - `import` works correctly
3. **Dynamic imports** - `import()` in CommonJS context
4. **TypeScript** - Types compile and work correctly
5. **Package installation** - npm install from tarball works

## Local Integration Testing

Run integration tests locally:

```bash
npm run test:integration
```

Integration tests are located in the `test/integration/` directory:

- `module-compatibility.test.cjs` - Tests CommonJS, ESM, and TypeScript compatibility
- `commonjs-require.test.cjs` - Tests basic CommonJS require() functionality

This runs a quick integration test that verifies:

- CommonJS require works
- ES Module import works
- Dynamic import in CommonJS works
- TypeScript types (if TypeScript is available)

## Manual Testing

For comprehensive manual testing, create a test suite:

```bash
# Create a test directory
mkdir test-manual && cd test-manual
npm init -y

# Install the local package
npm install ../

# Test CommonJS
echo "const validator = require('node-email-verifier');
validator('test@example.com', { checkMx: false })
  .then(result => console.log('CommonJS:', result));" > test-cjs.js
node test-cjs.js

# Test ES Modules
echo '{"type":"module"}' > package.json
echo "import validator from 'node-email-verifier';
const result = await validator('test@example.com', { checkMx: false });
console.log('ESM:', result);" > test-esm.mjs
node test-esm.mjs
```

## Adding New Integration Tests

To add new integration tests:

1. **For CI/CD**: Update `.github/workflows/integration-tests.yml`
2. **For local testing**: Update `scripts/integration-test.cjs`

## Troubleshooting

If integration tests fail:

1. **Check build output** - Ensure `dist/` contains:

   - `index.js` (ES module)
   - `index.cjs` (CommonJS wrapper)
   - `index.d.ts` (TypeScript definitions)

2. **Verify Node.js version** - Must be 18.0.0 or higher

3. **Check module resolution** - Ensure `package.json` exports field is correct

4. **TypeScript issues** - Verify `tsconfig.json` uses `NodeNext` module resolution
