# Security Policy

## Supported Versions

| Version | Support |
|---------|---------|
| 1.x     | Active  |

## Reporting a Vulnerability

If you find a security vulnerability in Tezgah's skill content or CLI tool, please **do not open a public issue on GitHub Issues.**

Instead, email: **gunerfatih@gmail.com**

### What to Include in Your Report

- The affected skill or component
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact

### Process

1. We will acknowledge your report within 48 hours
2. We will assess the issue and create a fix plan
3. We will notify you when the fix is published

### Scope

Tezgah is a skill set (a code generation guide), not a running application. The security vulnerability scope covers:

- **Unsafe code suggestions in skill content** (e.g. a schema suggestion vulnerable to SQL injection, insecure auth configuration)
- **Security issues in the CLI tool** (e.g. path traversal, file overwriting)
- **Missing security warnings** (security risks the skills should mention but have omitted)
