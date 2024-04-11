[![npm](https://img.shields.io/npm/dw/node-email-verifier.svg)](https://www.npmjs.com/package/node-email-verifier)
[![Node.js CI](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/nodejs-ci..yml/badge.svg)](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/nodejs-ci..yml)

# Node Email Verifier

Node Email Verifier is an email validation library for Node.js that checks if an
email address has a valid format and optionally verifies the domain's MX (Mail Exchange)
records to ensure it can receive emails.

## Features

- **RFC 5322 Format Validation**: Validates email addresses against the standard email formatting rules.
- **MX Record Checking**: Verifies that the domain of the email address has valid MX records indicating that it can receive emails. This check can be disabled using a parameter.


## Installation

Install the package using npm:

```bash
npm install node-email-verifier --save
```

## Usage

Here's how to use Node Email Verifier, with and without MX record checking:

```javascript
import emailValidator from 'node-email-verifier';

// Example with MX record checking
async function validateEmailWithMx(email) {
  try {
    const isValid = await emailValidator(email);
    console.log(`Is "${email}" a valid email address with MX checking?`, isValid);
  } catch (error) {
    console.error('Error validating email with MX checking:', error);
  }
}

// Example without MX record checking
async function validateEmailWithoutMx(email) {
  try {
    const isValid = await emailValidator(email, false);
    console.log(`Is "${email}" a valid email address without MX checking?`, isValid);
  } catch (error) {
    console.error('Error validating email without MX checking:', error);
  }
}

validateEmailWithMx('test@example.com').then();
validateEmailWithoutMx('test@example.com').then();
```

## API

### ```async emailValidator(email, checkMx = true)```

Validates the given email address, with an option to skip MX record verification.

#### Parameters

- ```email``` (string): The email address to validate.
- ```checkMx``` (boolean): Whether to check for MX records, this defaults to true.

#### Returns

- ```Promise<boolean>```: A promise that resolves to true if the email address is valid and, if checked, has MX records; false otherwise.

## Contributing

Contributions are always welcome! Feel free to submit a PR.

## License

This project is licensed under the MIT License.
