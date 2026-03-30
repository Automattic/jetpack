# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the Jetpack Monorepo, containing multiple WordPress plugins, Composer packages, and JavaScript packages used across the Jetpack ecosystem. The repository should NOT be cloned into a WordPress plugins directory - use symlinks or the Docker environment instead.

## Essential Commands

### Setup and Installation
```bash
# Initial setup (installs dependencies and links Jetpack CLI)
pnpm install && pnpm jetpack cli link

# Check if environment is ready for development
tools/check-development-environment.sh

# Install Docker environment (recommended)
cp tools/docker/default.env tools/docker/.env
# Edit .env to change WP_ADMIN_PASSWORD and other settings
jetpack docker up -d
jetpack docker install
# Access at http://localhost
```

### Building
```bash
# Build a specific project (interactive)
jetpack build

# Build with dependencies
jetpack build plugins/jetpack --deps

# Watch mode (continuous build on file changes)
jetpack watch

# Build all projects
jetpack install --all
```

### Testing
```bash
# Run tests (interactive selection)
jetpack test

# PHP unit tests in Docker
jetpack docker phpunit jetpack
jetpack docker phpunit jetpack -- --filter=TestName
jetpack docker phpunit jp-multisite -- --filter=TestName

# PHP unit tests for packages
cd projects/packages/assets
composer phpunit

# JavaScript tests
cd projects/packages/forms
pnpm test
pnpm test --watch -- path/to/test/file.js

# Jetpack plugin specific tests
cd projects/plugins/jetpack
pnpm test-adminpage    # Admin page tests
pnpm test-client       # Business logic tests
pnpm test-gui          # React component tests
pnpm test-extensions   # Block/editor extension tests
```

### Linting and Code Quality
```bash
# JavaScript linting
pnpm lint                    # Lint all JS
pnpm lint-changed            # Lint changed files only
pnpm lint-file path/to/file  # Lint specific file

# PHP linting
composer php:lint            # PHP syntax check
composer phpcs:lint          # PHPCS standards check
composer phpcs:fix           # Auto-fix PHPCS issues
composer phpcs:compatibility # Check PHP version compatibility

# Style linting
pnpm lint-style "**/*.css"

# TypeScript
pnpm typecheck
```

### Git Workflow
```bash
# Main branch for PRs
trunk

# Enable draft mode for collaborative work (loosens pre-commit checks)
jetpack draft enable
jetpack draft disable
```

## Monorepo Architecture

### Project Structure
- `projects/plugins/` - WordPress plugins (jetpack, backup, boost, crm, protect, etc.)
- `projects/packages/` - Composer packages shared across plugins
- `projects/js-packages/` - JavaScript packages for shared frontend code
- `projects/github-actions/` - Reusable GitHub Actions
- `tools/` - Development tools and scripts
- `tools/cli/` - Jetpack CLI tool source
- `tools/docker/` - Docker development environment

### Key Packages
Jetpack uses a monorepo pattern where functionality is split into reusable packages. Before adding new functionality or dependencies:
1. Survey existing packages for similar functionality
2. Check for reusable components in shared packages
3. Prioritize internal packages over external dependencies
4. Consider extending existing functionality rather than duplicating

Common packages include: `connection`, `assets`, `config`, `status`, `sync`, `autoloader`, `logo`, `options`, `roles`, etc.

### Package Usage
To use a package in a project:
1. Add to `composer.json`: `"automattic/jetpack-logo": "@dev"`
2. Run `tools/fixup-project-versions.sh`
3. Run `jetpack install plugins/jetpack`
4. Import in PHP: `use Automattic\Jetpack\Assets\Logo;`

## Coding Standards

### PHP
- Follow WordPress PHP Coding Standards
- Prefix global functions/hooks with `jetpack_`
- Use `$$next-version$$` for version annotations in DocBlocks:
  - `@since $$next-version$$`
  - `@deprecated $$next-version$$`
  - `_deprecated_function( __METHOD__, 'package-$$next-version$$' );`
- Deprecate code for 6 months before removal
- Use proper WordPress nonce verification and sanitization
- Textdomain: Packages use 'jetpack', consuming plugins update at build time

Minimum PHP versions:
- Monorepo/CLI: PHP 8.2
- Most plugins: WordPress minimum (currently 7.2+)
- Some plugins have higher requirements (e.g., CRM requires 7.4+)

### JavaScript/React
- Use modern ES6+ following WordPress standards
- Import React via `@wordpress/element` not direct React import
- Use WordPress data stores for state management (`@wordpress/data`)
- Use `@wordpress/i18n` for translations with appropriate text domain
- Use `@babel/preset-typescript` for TypeScript in Webpack (not `ts-loader`)
- Follow Gutenberg component patterns and accessibility guidelines
- Test with Jest and `@testing-library/react`

### Naming Conventions
- PHP functions: lowercase with underscores
- React components: Follow WordPress patterns
- SCSS: BEM-like naming
- Test classes: Must end in "Test" with matching filenames

### Browser Support
Follow Gutenberg's browser support via the `browserslist-config` package.

## Changelog Management

Every change in `/projects` requires a changelog file in the project's `changelog` directory:

```
Significance: patch|minor|major
Type: security|added|changed|deprecated|removed|fixed

Description of the change for the changelog.
```

Commands:
```bash
jetpack changelog add plugins/jetpack
jetpack changelog version plugins/jetpack current
```

## Development Workflow

### Pattern Consistency
Before implementing features:
1. Survey similar features for established patterns
2. Follow existing naming conventions and file organization
3. Mirror successful implementation patterns
4. Maintain consistent import ordering and error handling
5. Match existing directory structures

### WordPress Debug Constants
Add to `wp-config.php`:
```php
define( 'WP_DEBUG', true );           // Enable debug mode
define( 'SCRIPT_DEBUG', true );       // Load non-minified JS
define( 'JETPACK_DEV_DEBUG', true );  // Enable offline mode
```

### Testing Cloud Features
Use tunneling for WordPress.com connection testing:
- Automatticians: Jurassic Tube (see internal docs PCYsg-GJ2-p2)
- Others: ngrok or similar services

### Custom Code Snippets
Add mu-plugins to `tools/docker/mu-plugins/` (gitignored) for testing.

## Tool Versions
Versions specified in `.github/versions.sh`:
- Node.js: 22.12.0
- PNPM: 10.4.0
- PHP: 8.2 (for CI/CLI)
- Composer: 2.8.12
- PHP Range: 7.2 - 8.5

Version management:
- Node: Use `nvm` to match `.nvmrc`
- Check: `tools/check-development-environment.sh`

## Jetpack CLI

The CLI is the primary tool for monorepo development. Key commands:
- `jetpack build` - Build projects
- `jetpack watch` - Watch and rebuild on changes
- `jetpack install` - Install dependencies
- `jetpack test` - Run tests
- `jetpack docker` - Manage Docker containers
- `jetpack changelog` - Manage changelog files
- `jetpack generate` - Create new projects
- `jetpack clean` - Clean build artifacts
- `jetpack rsync` - Sync to remote servers

Run `jetpack help` or `jetpack [command] --help` for details.

## Important Notes

### Short Codes
Check user messages for:
- `ddc` (discuss don't code) - Only discuss options, don't make changes
- `jdi` (just do it) - Proceed with discussed changes

### Package Development
Use classmap autoloading for WordPress Coding Standards compliance.
Provide `jetpack:src` entries in package.json `.exports` to avoid pre-build requirements.

### Dependencies
- Match existing monorepo package versions when possible
- Large dependencies: Choose options already in use
- Consider bundle size and code splitting for performance

### E2E Testing
- Standalone E2E: Use `playwright` via `allure-playwright`
- Simple/Atomic tests: Live in [Calypso repo](https://github.com/Automattic/wp-calypso)

### Security
- Sanitize all URLs, attributes, and output
- Use WordPress escaping functions: `esc_html__`, `esc_attr__`, etc.
- Implement nonce verification for actions
- Follow WordPress VIP security guidelines

### Deprecation
Mark files/functions as deprecated for 6 months before removal:
- Files: `_deprecated_file`
- Functions: `_deprecated_function`
- Methods: `_deprecated_function` with `__METHOD__`
