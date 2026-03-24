# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Parent Monorepo

This package lives in the Jetpack monorepo. See the root `AGENTS.md` for monorepo-wide conventions (changelog entries, version annotations with `$$next-version$$`, PR workflow, coding standards).

## Commands

```bash
# Build
pnpm run build                    # Full build (all targets)
pnpm run build:blocks             # Blocks only
pnpm run build:dashboard          # Dashboard only
pnpm run watch                    # Watch all targets

# Test
pnpm test                         # JS tests (Jest)
pnpm run test-php                 # PHP tests (PHPUnit)

# Lint & typecheck
pnpm run typecheck                # TypeScript validation (tsgo --noEmit)

# Icons (run after modifying any field-*/icon.{js,jsx,tsx})
pnpm generate-icons               # Full pipeline: React → SVG → PNG
```

Jest uses `--experimental-vm-modules` and config at `tests/jest.config.js`. PHP tests use PHPUnit with WorDBless; configs are `phpunit.*.xml.dist`.

## Architecture

This is a hybrid PHP/JS package implementing Jetpack's contact forms: WordPress blocks, a PHP backend, a React dashboard, and a form editor.

### Source Layout (`src/`)

- **`class-jetpack-forms.php`** — Package entrypoint, registered via Composer classmap autoload
- **`blocks/`** — WordPress block editor blocks
  - `contact-form/` — Main form container block
  - `field-*/` — Individual field blocks (text, email, checkbox, dropdown, etc. — 21+ types)
  - `form-step*/` — Multi-step form support
  - `shared/` — Shared block utilities and hooks
- **`contact-form/`** — PHP backend: form processing, submission handling, email notifications
- **`dashboard/`** — React app for managing form responses (uses Redux via `store/`)
- **`form-editor/`** — React form editor interface
- **`service/`** — Third-party integrations (Mailpoet, Google Drive, Webhooks, Hostinger Reach)
- **`store/`** — Redux store for dashboard state
- **`hooks/`** — Custom React hooks
- **`modules/`** — Standalone JS modules (built separately)
- **`abilities/`** — WordPress Abilities API integration

### Build System

Multiple webpack configs in `tools/` produce separate bundles:
- `webpack.config.blocks.js` → `dist/blocks/`
- `webpack.config.contact-form.js` → `dist/contact-form/`
- `webpack.config.dashboard.js` → `dist/dashboard/`
- `webpack.config.form-editor.js` → `dist/form-editor/`
- `webpack.config.modules.js` → `dist/modules/`

### Tests

- **JS**: `tests/js/` mirrors `src/` structure (`blocks/`, `contact-form/`, `dashboard/`). Uses `@testing-library/react`.
- **PHP**: `tests/php/contact-form/`. Test classes extend WorDBless `BaseTestCase`, names must end in `Test`.
