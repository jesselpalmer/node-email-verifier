# Security Policy

  ## Supported Versions

  The following versions of node-email-verifier are currently receiving security updates:

  | Version | Supported          |
  | ------- | ------------------ |
  | 3.1.x   | :white_check_mark: |
  | 3.0.x   | :white_check_mark: |
  | < 3.0   | :x:                |

  ## Reporting a Vulnerability

  If you discover a security vulnerability in node-email-verifier, please report it by:

  1. **Email**: Send details to security@validkit.com
  2. **Do NOT** open a public issue

  ### What to Include

  - Description of the vulnerability
  - Steps to reproduce
  - Potential impact
  - Suggested fix (if any)

  ### What to Expect

  - **Response Time**: You'll receive an acknowledgment within 48 hours
  - **Updates**: We'll keep you informed about our progress
  - **Resolution**: Security patches are typically released within 7-14 days
  - **Credit**: We'll credit you in the release notes (unless you prefer to remain anonymous)

  ### Scope

  This project validates email formats and checks MX records. Security issues might include:
  - ReDoS (Regular Expression Denial of Service) vulnerabilities
  - DNS injection possibilities
  - Issues that could leak sensitive information

  Thank you for helping keep node-email-verifier secure! 🔐
