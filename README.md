[![npm](https://img.shields.io/npm/dw/node-email-verifier.svg)](https://www.npmjs.com/package/node-email-verifier)
[![Node.js CI](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/node.js.yml/badge.svg)](https://github.com/jesselpalmer/node-email-verifier/actions/workflows/node.js.yml)

# Node Email Verifier

Node Email Verifier is a email validation library for Node.js that checks if an
email address has a valid format and verifies the domain's MX (Mail Exchange)
records to ensure it can receive emails.

## Features

- **RFC 5322 Format Validation**: Validates email addresses against the standard
email formatting rules.
- **MX Record Checking**: Verifies that the domain of the email address has
valid MX records indicating that it can receive emails.

## Installation

Install the package using npm:

```bash
npm install node-email-verifier --save
```

## Usage

Here's a simple example of how to use Node Email Verifier:

```javascript
const emailValidator = require('node-email-verifier');

async function validateEmail(email) {
  try {
    const isValid = await emailValidator(email);
    console.log(`Is the email valid? ${isValid}`);
  } catch (error) {
    console.error('Error validating email:', error);
  }
}

validateEmail('test@example.com').then();
```

## API

### ```async emailValidator(email)```

Validates the given email address.

#### Parameters

- ```email``` (string): The email address to validate.

#### Returns

- ```Promise<boolean>```: A promise that resolves to true if the email address is valid, false otherwise.

## Contributing

Contributions are always welcome! Feel free to submit a PR.

## License

This project is licensed under the MIT License.
