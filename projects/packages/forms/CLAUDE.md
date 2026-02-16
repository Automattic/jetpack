# Jetpack Forms Package

## Codex

This project has a `.codex/` knowledge system for architecture documentation.
Always read `.codex/README.md` first when working on this project.

## Quick Overview

The `automattic/jetpack-forms` package provides contact forms for WordPress/Jetpack sites. It handles:
- Block registration and server-side rendering (Gutenberg `jetpack/contact-form` block)
- 20+ field types with 3 style variations
- Form submission with JWT-based stateless processing
- Spam detection (WordPress blocklist + Akismet)
- Feedback storage as `feedback` custom post type
- Email notification delivery
- Integrations (webhooks, MailPoet, Google Drive export, Salesforce)
- GDPR personal data export/erasure
- Admin dashboard for viewing responses

## Key Files

| File | Role |
|------|------|
| `src/class-jetpack-forms.php` | Package entry point |
| `src/contact-form/class-contact-form.php` | Core: rendering, submission, JWT, email |
| `src/contact-form/class-contact-form-plugin.php` | Singleton: blocks, spam, GDPR, export |
| `src/contact-form/class-contact-form-field.php` | Field rendering and validation |
| `src/contact-form/class-feedback.php` | Feedback data model |

## Tooling

All commands require `nvm use` first to set the correct Node.js version for Jetpack tooling.

```bash
# Testing
nvm use && jetpack test js packages/forms --verbose     # JS tests (Jest)
nvm use && jetpack test php packages/forms --verbose    # PHP tests (PHPUnit)

# Static Analysis
nvm use && jetpack phan packages/forms                  # Phan PHP static analysis

# Building
nvm use && jetpack build packages/forms                 # Build package assets
nvm use && jetpack build packages/forms --deps          # Build with dependencies

# Watching
nvm use && jetpack watch packages/forms                 # Watch and rebuild on changes

# Linting
composer phpcs:lint                                     # PHP CodeSniffer (from package dir)
pnpm lint                                               # JS/TS linting (from package dir)
```
