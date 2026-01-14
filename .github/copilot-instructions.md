# Jetpack Monorepo - Copilot Instructions

## Repository Overview

This is the Jetpack Monorepo containing WordPress plugins, Composer packages, JavaScript packages, and GitHub Actions for the Jetpack ecosystem. The repository is a large-scale monorepo with complex dependencies and build tooling.

**Key characteristics:**
- Monorepo structure with multiple project types under `/projects`
- Uses PNPM for JavaScript dependencies with workspaces
- Uses Composer for PHP dependencies
- Custom CLI tool (`jetpack`) for common development tasks
- Docker-based development environment (recommended and supported)

## Repository Structure

```
/projects
  /plugins         - WordPress plugins (e.g., jetpack, jetpack-boost)
  /packages        - Composer/PHP packages with "automattic/jetpack-" prefix
  /js-packages     - JavaScript/TypeScript packages with "@automattic/" prefix
  /github-actions  - GitHub Actions with "automattic/action-" prefix
/docs             - Comprehensive documentation
/tools            - Monorepo-wide tooling and Docker environment
/.github          - CI workflows, actions, and repository configuration
```

## Development Environment Setup

**Required versions:**
- Node.js: 22.19.0 (specified in `.nvmrc`)
- PNPM: 10.27.0 (specified in `package.json`)
- PHP: 7.2-8.5 (compatible with WordPress requirements)
- Composer: Latest stable

**Initial setup (first time only):**
1. Clone the repository (NOT into WordPress plugins directory)
2. Run `pnpm install` (installs all JavaScript dependencies)
3. Run `pnpm jetpack cli link` (makes `jetpack` command available globally)
4. Optional: Run `tools/check-development-environment.sh` to verify setup

**Docker setup (recommended):**
1. Install Docker via `brew install --cask docker` (macOS) or `brew install docker` (Linux)
2. Copy settings: `cp tools/docker/default.env tools/docker/.env`
3. Start containers: `jetpack docker up -d`
4. Install WordPress: `jetpack docker install`
5. Access site at http://localhost

## Building and Testing

**Building projects:**
- Build a project: `jetpack build <type/project>` (e.g., `jetpack build plugins/jetpack`)
- Build with dependencies: `jetpack build <type/project> --deps`
- Continuous build (watches for changes): `jetpack watch`
- Build all projects: Rarely needed, build specific projects instead

**Testing:**
- Run tests interactively: `jetpack test` (then select project and test type)
- PHP unit tests: Projects have individual `phpunit.xml.dist` files
- JavaScript tests: Use Jest with `@testing-library/*` for unit tests
- E2E tests: Use Playwright with `allure-playwright`

**Linting and code quality:**
- JavaScript lint: `pnpm run lint` or `pnpm run lint-changed`
- JavaScript lint with errors only: `pnpm run lint-required`
- Style lint: `pnpm run lint-style`
- PHP lint: `composer phpcs:lint` or `pnpm run php:lint`
- PHP autofix: `composer phpcs:fix` or `pnpm run php:autofix`
- PHP compatibility check: `composer phpcs:compatibility` or `pnpm run php:compatibility`
- Type checking: `pnpm typecheck`

**Important:** Always run linters and tests before committing. The CI system runs extensive checks including:
- Linting (JavaScript, PHP, CSS)
- Unit tests (PHP, JavaScript)
- E2E tests
- Code coverage checks
- PHP compatibility checks

## Changelog Management

**CRITICAL:** Every PR touching `/projects` MUST include a changelog entry via `jetpack changelog add`.

**Changelog entry guidelines:**
- Must be grammatically correct and free of typos
- Must start with a capital letter and end with a period
- Use imperative mood (e.g., "Add feature." not "Added feature" or "Adds feature")
- Use component/feature prefix for specific changes (e.g., "Connection: Fix timeout issue with site registration.")
- Do NOT use package/project name as prefix within that same package (e.g., no `Forms:` prefix in `projects/packages/forms/`)
- Describe from user's perspective, not implementation details

## Coding Standards

**PHP:**
- Follow [WordPress Core coding standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/)
- Use Jetpack's additional standards enforced by PHPCS
- PHP 7.2+ compatibility required for most projects (some require higher, check project's `readme.txt`)
- Use `_deprecated_function()` when deprecating, keep deprecated code for 6 months
- Never delete/rename files or functions without proper deprecation

**JavaScript/TypeScript:**
- Use Webpack, Babel, React stack (see `projects/js-packages/webpack-config` for shared config)
- Use Jest with `@testing-library/*` for testing
- Use ESLint (config at monorepo root)
- Use `@wordpress/i18n` for translations with appropriate text domains
- Use Gutenberg's `browserslist-config` for browser compatibility
- Prefer existing monorepo packages over adding new dependencies

**CSS/SCSS:**
- Use logical properties instead of physical direction/dimension mappings for RTL-aware CSS
- Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties

**General:**
- Sanitize all URLs and attributes (see WordPress.com VIP guidelines)
- Create unit tests for new functionality
- Document public APIs with inline documentation
- Avoid `$$next-version$$` placeholder modifications (replaced during release process)

## Code Review Guidelines

When performing a code review, check for:
- Adherence to coding standards in `/docs/coding-guidelines.md`
- Inconsistent naming conventions
- Typos in user-facing strings
- Missing documentation for public APIs
- Missing explanations for complex/non-obvious logic
- Inefficient algorithms
- Security issues (sanitization, escaping, injection vulnerabilities)
- CSS using logical properties for RTL support
- Proper changelog entries
- Adequate test coverage

## Common Patterns

**When adding dependencies:**
- Prefer existing monorepo packages
- Check if dependency already exists elsewhere in monorepo
- Match versions with existing uses when possible
- For large dependencies, consider if they're already in use

**Monorepo packages (`js-packages`):**
- Should provide `jetpack:src` entries in `.exports` in `package.json`
- Avoid `.scripts.prepare` or compilation on install
- This enables ESLint to run without building first

**Translations:**
- PHP: Use safe functions like `esc_html__`, `esc_html_e`, `esc_html_x`
- JavaScript: Use `@wordpress/i18n` package
- Use appropriate unique text domain for each plugin/package
- Use babel plugin `@automattic/babel-plugin-replace-textdomain` for bundling

## Git Workflow

- Monorepo uses standard Git workflow
- All GitHub Actions configuration in `.github/workflows/`
- CI runs on all PRs: linting, testing, building, compatibility checks
- Docker environment files in `tools/docker/`
- Don't commit the monorepo itself to WordPress plugins directory (symlink instead)

## Key Documentation Files

- `/docs/quick-start.md` - Quick start guide
- `/docs/development-environment.md` - Detailed setup instructions
- `/docs/coding-guidelines.md` - Coding standards and guidelines
- `/docs/monorepo.md` - Monorepo structure and tooling
- `/docs/CONTRIBUTING.md` - Contribution guidelines
- `/docs/writing-a-good-changelog-entry.md` - Changelog best practices

## Special Notes

- The "$$next-version$$" placeholders are automatically replaced during releases - NEVER modify them
- Deprecated code must remain for 6 months before removal
- Always test with Docker environment when possible (only supported setup)
- Use `jetpack` CLI for common tasks rather than manual commands
- Changelogger is mandatory for all project changes
