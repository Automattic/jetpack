# Jetpack Monorepo - Copilot Agent Instructions

## Repository Overview

**Jetpack Monorepo** is a large-scale WordPress development monorepo containing multiple plugins, Composer packages, JavaScript packages, and GitHub Actions for the Jetpack ecosystem. The repository uses **pnpm workspaces** for JavaScript and **Composer** for PHP dependencies.

### Key Stats
- **Languages**: PHP (WordPress), JavaScript/TypeScript, CSS
- **Size**: 100+ workspace projects across plugins, packages, and tools
- **Package Manager**: pnpm v10.22.0 (strict version requirement)
- **Node Version**: 22.19.0 (strict requirement from .nvmrc)
- **PHP Version**: 8.4 (recommended), supports 7.2-8.5
- **Composer Version**: 2.9.2

## Environment Setup - CRITICAL REQUIREMENTS

### Installation Order (MUST follow exactly)

1. **Node.js 22.19.0** - Use nvm: `nvm install 22.19.0 && nvm use 22.19.0`
   - The repository has `engineStrict: true` - wrong Node version will fail
   - Check with: `node --version`

2. **pnpm 10.22.0** - Install globally: `npm install -g pnpm@10.22.0`
   - Version must match exactly - package.json enforces this
   - Check with: `pnpm --version`

3. **PHP 8.4** - Required for linting and testing
   - Minimum: PHP 7.2, Maximum tested: PHP 8.5
   - Check with: `php --version`

4. **Composer 2.9.2** - PHP dependency manager
   - Use version 2.3.x or later
   - Check with: `composer --version`

5. **Additional tools**: bash 4.3+, jq (JSON processor)
   - On macOS: `brew install bash jq`

### Environment Validation Script

**ALWAYS run this before starting work:**
```bash
tools/check-development-environment.sh
```
This validates all requirements and provides guidance for fixing issues.

## Project Structure

```
jetpack/
├── projects/
│   ├── plugins/          # WordPress plugins (jetpack, backup, boost, etc.)
│   ├── packages/         # Composer packages (74 packages)
│   ├── js-packages/      # JavaScript/TypeScript packages
│   └── github-actions/   # Reusable GitHub Actions
├── tools/                # Build scripts, Docker config, CLI
│   ├── cli/             # Jetpack CLI tool
│   ├── docker/          # Docker development environment
│   └── *.sh             # Build/release/validation scripts
├── docs/                 # Development documentation
├── .github/
│   ├── workflows/       # CI/CD workflows (build, linting, tests)
│   ├── actions/         # Custom GitHub Actions
│   └── files/           # Workflow helper scripts
├── composer.json         # Root Composer config (dev tools only)
├── package.json          # Root pnpm workspace config
├── pnpm-workspace.yaml   # Workspace configuration
└── pnpm-lock.yaml       # Lock file (1.3M+ lines)
```

## Build Process - CRITICAL STEPS

### Initial Setup (First Time Only)

```bash
# 1. Install Node modules (takes ~40s)
pnpm install

# 2. Install PHP dependencies (may require GitHub token)
composer install

# 3. Link the Jetpack CLI globally (optional but recommended)
pnpm jetpack cli link
```

**IMPORTANT**: If `composer install` asks for a GitHub token, this is expected for private dependencies. Set `COMPOSER_AUTH` or use `composer config` to provide credentials.

### Building Projects

The monorepo uses the **Jetpack CLI** for building:

```bash
# Build a specific plugin with dependencies
jetpack build plugins/jetpack --deps

# Build a package
jetpack build packages/connection

# Watch mode for continuous rebuild
jetpack watch plugins/jetpack
```

**Build commands defined in composer.json**:
- `build-development`: Development build (unminified)
- `build-production`: Production build (minified, optimized)

**CRITICAL**: Never run `pnpm install` or `composer install` inside build scripts - the build process assumes these are already done.

### Building for Production

Production builds set:
- `NODE_ENV=production`
- `BABEL_ENV=production`
- `COMPOSER_ROOT_VERSION=dev-trunk`

For plugins, composer uses: `-o --no-dev --classmap-authoritative --prefer-dist`

## Testing - Complete Workflow

### Test Types and Commands

The monorepo has **4 test types**, defined in each project's `composer.json`:

1. **PHP Unit Tests**: `.scripts.test-php`
   ```bash
   jetpack test php plugins/jetpack
   # Or for Docker environment:
   jetpack docker phpunit jetpack
   ```

2. **JavaScript Tests**: `.scripts.test-js`
   ```bash
   jetpack test js packages/connection
   # Or directly in project:
   cd projects/packages/connection && pnpm test
   ```

3. **Code Coverage**: `.scripts.test-coverage`
   ```bash
   jetpack test coverage plugins/jetpack
   ```
   - Requires pcov or xdebug PHP extension
   - Outputs to `$COVERAGE_DIR` environment variable

4. **TypeScript Type Checking**: `.scripts.typecheck` (in package.json)
   ```bash
   pnpm typecheck  # Runs across all projects
   ```

### PHP Testing Details

**For plugins using WordPress:**
- Tests run in WordPress installation at `$WORDPRESS_DIR`
- WordPress develop checkout at `$WORDPRESS_DEVELOP_DIR`
- MySQL available at 127.0.0.1 (credentials in ~/.my.cnf)
- Tests run against: latest WP, previous WP, trunk WP
- Multiple PHP versions: 7.2 through 8.5

**PHPUnit versions**: Projects use yoast/phpunit-polyfills for compatibility

### JavaScript Testing Details

- **Use Jest** (not mocha/chai/sinon)
- **React testing**: Use @testing-library/react (not enzyme)
- Watch mode: `cd project && pnpm test --watch`

## Linting and Code Standards - MANDATORY

### PHP Linting

```bash
# Lint all PHP code
composer phpcs:lint

# Fix auto-fixable issues
composer phpcs:fix

# Lint only changed files
composer phpcs:changed

# Check PHP compatibility (7.2-8.5)
composer phpcs:compatibility

# Lint required files only (non-excluded)
composer phpcs:lint:required
```

**Configuration files**:
- `.phpcs.xml.dist` - Main phpcs config
- `.phpcs.config.xml` - Additional standards
- `.phpcsignore` - Excluded files
- `tools/phpcs-excludelist.json` - Optional excludes

### JavaScript/TypeScript Linting

```bash
# Lint all JS/TS
pnpm lint

# Lint only changed files
pnpm lint-changed

# Lint specific file
pnpm lint-file path/to/file.js
```

**Configuration**: `eslint.config.mjs` at root and per-project

### CSS Linting

```bash
pnpm lint-style
```

**Configuration**: `stylelint.config.mjs`

### Static Analysis (Phan)

```bash
jetpack phan
```
- Requires PHP ast extension (install via pecl)
- Config in `.phan/config.php` per project
- Baseline files at `.phan/baseline.php`

## CI/CD Workflows - What Gets Checked

### On Every Pull Request

1. **Build Workflow** (.github/workflows/build.yml)
   - Builds all changed projects
   - Timeout: 30 minutes
   - Detects changed projects automatically
   - Creates build artifacts

2. **Linting Workflow** (.github/workflows/linting.yml)
   - PHP linting (phpcs)
   - JavaScript linting (eslint)
   - CSS linting (stylelint)
   - Only runs on changed file types

3. **Tests Workflow** (.github/workflows/tests.yml)
   - PHP tests (multiple PHP versions)
   - JavaScript tests
   - Code coverage
   - TypeScript type checking
   - E2E tests (for plugins with test-e2e)
   - Uses matrix strategy for different PHP/WP versions

### Changed File Detection

CI only runs tests for **changed projects and their dependencies**. Dependencies detected from:
- `composer.json` require/require-dev
- `package.json` dependencies/devDependencies
- `.extra.dependencies.test` in composer.json

## Common Pitfalls and Solutions

### 1. Node Version Mismatch
**Error**: "Unsupported environment (bad pnpm and/or Node.js version)"
**Fix**: 
```bash
nvm install 22.19.0 && nvm use 22.19.0
```

### 2. pnpm Not Found After Install
**Cause**: pnpm not in PATH
**Fix**:
```bash
pnpm setup  # Configures shell integration
# Then restart terminal or source shell rc file
```

### 3. Composer GitHub Token Required
**Error**: "Could not fetch https://api.github.com/repos/..."
**Fix**: This is normal for accessing GitHub Composer repositories. Set up authentication:
```bash
composer config --global github-oauth.github.com YOUR_TOKEN
```

### 4. Build Fails with "Pnpm Not Found"
**Cause**: Using wrong Node version or pnpm not installed
**Fix**: Check `node --version` is 22.19.0 and `pnpm --version` is 10.22.0

### 5. Pre-commit/Pre-push Hooks Fail
**Cause**: Husky git hooks enforcing quality
**Fix**: 
- Run `pnpm lint` and `composer phpcs:lint` before committing
- For drafts: `jetpack draft enable` (less strict hooks)
- When ready: `jetpack draft disable`

### 6. Changelog Entry Required
**Error**: CI fails with "Changelogger validity" error
**Cause**: All PRs touching projects/* need changelog entries
**Fix**:
```bash
jetpack changelog add
# Follow prompts to create change file
```

For trivial changes:
```
Significance: patch
Type: compat
Comment: Updated dependencies, no changelog needed
```

### 7. Tests Pass Locally But Fail in CI
**Common causes**:
- Different PHP version (CI runs 7.2-8.5)
- Different WordPress version (latest, previous, trunk)
- Missing build step before tests
**Fix**: Check test scripts include build commands if needed

### 8. Docker WordPress Installation
```bash
# Start Docker environment
jetpack docker up -d

# Install WordPress
jetpack docker install

# Access at http://localhost
```

**Config**: `tools/docker/.env` (copy from `tools/docker/default.env`)

## Monorepo-Specific Workflows

### Adding a New Project

```bash
jetpack generate [package|plugin|github-action] --name project-name
```

Includes: composer.json, package.json, README.md, LICENSE.txt, .gitignore

### Changelogger (Required for Releases)

All PRs need changelog entries in changed projects:

```bash
jetpack changelog add
```

**Change file headers**:
- `Significance`: patch | minor | major (semver)
- `Type`: changed | added | deprecated | removed | fixed | security | compat
- Body: User-facing description (or use `Comment:` for no entry)

### Version Management

```bash
# Check version
tools/project-version.sh plugins/jetpack

# Update version
tools/project-version.sh plugins/jetpack 12.0
```

### Installing Only Root Dependencies

```bash
jetpack install --root
```

### Cleaning Build Artifacts

```bash
# Clean specific project
jetpack clean plugins/jetpack

# Clean all node_modules and vendor dirs
jetpack clean --dist
```

## Quick Reference - Common Commands

```bash
# Environment check
tools/check-development-environment.sh

# Install everything
pnpm install && jetpack install --root

# Build plugin with dependencies
jetpack build plugins/jetpack --deps

# Watch for changes
jetpack watch plugins/jetpack

# Run tests
jetpack test php plugins/jetpack
jetpack test js packages/connection

# Lint everything
pnpm lint
composer phpcs:lint

# Fix linting issues
composer phpcs:fix

# Docker WordPress
jetpack docker up -d
jetpack docker install

# Add changelog
jetpack changelog add

# Start draft mode (relaxed hooks)
jetpack draft enable
```

## Key Files to Know

- **versions.sh**: `.github/versions.sh` - Defines PHP/Node/Composer/pnpm versions
- **Build config**: Each project's `composer.json` `.scripts.build-*`
- **Test config**: Each project's `composer.json` `.scripts.test-*`
- **Monorepo docs**: `docs/monorepo.md`, `docs/development-environment.md`
- **Contributing**: `docs/CONTRIBUTING.md`
- **CLI help**: `tools/cli/README.md`
- **Docker setup**: `tools/docker/README.md`

## Trust These Instructions

**These instructions are comprehensive and validated**. When working in this repository:

1. Follow the environment setup exactly - version mismatches cause cryptic errors
2. Always run validation script first: `tools/check-development-environment.sh`
3. Use the Jetpack CLI (`jetpack`) for builds, tests, and project management
4. All PRs need changelog entries via `jetpack changelog add`
5. Lint before committing: `pnpm lint && composer phpcs:lint`

Only search for additional information if:
- Instructions are incomplete for your specific use case
- Commands fail with unexpected errors
- Working with a project type not covered here

The monorepo tooling is mature and well-documented. Trust the scripts and CLI - they handle complexity for you.
