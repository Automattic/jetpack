# Jetpack Monorepo

## Confidentiality

CRITICAL: This is a **public repository**. Never include private WordPress.com URLs (e.g., `*.wordpress.com` internal sites) in PR descriptions, commit messages, code comments, or any public-facing text. Use the p2 shorthand syntax instead (e.g., `peKye1-1Z1-p2`).

## Project Structure

- `projects/plugins/` — WordPress plugins
- `projects/packages/` — Composer/PHP packages
- `projects/js-packages/` — JavaScript/npm packages
- `projects/github-actions/` — GitHub Actions
- `tools/` — Monorepo tooling
- `docs/` — Documentation

Projects define build steps in `composer.json`:
- `.scripts.build-production` — Production build (set `NODE_ENV=production`)
- `.scripts.build-development` — Development build
- `.scripts.test-php` — PHP tests
- `.scripts.test-js` — JavaScript tests

### Environment Variables

- `FORCE_PULL=1` — Force pull latest Docker image
- `BUILD_LOCAL=1` — Build Docker image locally
- `DEBUG=1` — Enable debug output

## Jetpack CLI (`jp`)

The `jp` command runs `pnpm jetpack` inside the monorepo Docker container. Install globally: `npm install -g @automattic/jetpack-cli` (this is a global install, safe to run even inside a Jetpack checkout). `jp` commands work from git worktrees — the CLI resolves to the monorepo root automatically.

### Common Commands

```bash
jp build plugins/jetpack          # Build a project
jp build plugins/jetpack --deps   # Build with dependencies
jp watch plugins/jetpack          # Watch and rebuild on changes
jp test php packages/connection    # Run PHP tests (packages)
jp test js packages/connection     # Run JS tests
jp changelog add                  # Add changelog entry (interactive)
jp generate                       # Create new project (interactive wizard)
jp install plugins/jetpack        # Install project dependencies
jp clean plugins/jetpack          # Clean build artifacts
jp docker up -d                   # Start Docker environment
jp docker install                 # Install WordPress in Docker
# In a git worktree, run `tools/docker/bin/seed-worktree-env.sh` once BEFORE `jp docker up`.
# It writes a unique COMPOSE_PROJECT_NAME + free ports to tools/docker/.env (which `jp docker up`
# reads) so worktrees don't clobber the primary jetpack_dev or each other. Without it, every
# bare `up` shares jetpack_dev on the default ports. The script is idempotent and a no-op in the
# primary checkout, so it's safe to run before every `up`.
# See tools/docker/README.md § "Parallel development environments", or use the `/work-on` skill end-to-end.
jp phan                           # Run PHP static analysis
```

### Creating New Projects

Use `jp generate` to create new projects:
- **Plugins**: `jp generate plugin --name my-plugin` (choose "Starter plugin" for React admin page example, or "Blank plugin" for minimal scaffolding)
- **Packages**: `jp generate package --name my-package`
- **JS Packages**: `jp generate js-package --name my-js-package`
- **GitHub Actions**: `jp generate github-action --name my-action`

## Coding Conventions

Detailed guidelines are in `docs/coding-guidelines.md`.

### Naming Conventions

- Use WordPress naming conventions for functions and classes
- Prefix global PHP functions and hooks with `jetpack_`
- Use lowercase with underscores for PHP functions
- Follow WordPress React component naming patterns
- Use BEM-like naming for SCSS

### PHP Standards

- Follow WordPress PHP Coding Standards
- Use proper WordPress prefix for functions and classes
- Implement WordPress nonce verification for form handling and AJAX
- Follow WordPress database operations best practices (`$wpdb` prepared statements)
- Structure plugin hooks logically

#### Version Annotations

When adding a version number in a DocBlock, MUST use `$$next-version$$`:

- `@since $$next-version$$`
- `@deprecated $$next-version$$`
- `@deprecated since $$next-version$$`
- `_deprecated_function( __METHOD__, 'package-$$next-version$$' );`

The `$$next-version$$` placeholder is automatically replaced with the correct version at release time. Do NOT replace these with actual version numbers.

### JavaScript & React Standards

- Write modern ES6+ code following WordPress JS standards
- Importing from `react` directly is fine. `@wordpress/element` also works but is no longer required — follow the convention used in the package you're working in
- Use WordPress data stores (`@wordpress/data`) for state management
- Use `@wordpress/i18n` for translations with an appropriate unique text domain
- Follow WordPress component lifecycle patterns and accessibility guidelines
- When using TypeScript with Webpack, use `@babel/preset-typescript` rather than `ts-loader`

### CSS / SCSS

- Use BEM-like naming conventions
- Use CSS logical properties instead of physical direction/dimension mappings to make styles RTL-aware by default (reference: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)

## Testing

```bash
jp test php <project> -v          # PHPUnit tests (verbose)
jp test js <project>              # Jest tests
jp test php-coverage <project>    # Generate PHP coverage report
jp test js-coverage <project>     # Generate JS coverage report
```

### Testing Prerequisites

- **Packages** (`jp test php packages/...`, `jp test js packages/...`): Work immediately with no extra setup. The monorepo Docker container handles everything.
- **Plugins**: Some plugins use mocked WordPress environments (WorDBless/Brain Monkey) and their tests work immediately via `jp test php`. Others (notably `plugins/jetpack` and `plugins/wpcomsh`) require a full WordPress test environment:
  1. `jp docker up -d` — Start Docker WordPress containers
  2. `jp docker install` — Install WordPress in Docker
  Then run: `jp docker phpunit <target>` where `<target>` can be `jetpack`, `jp-multisite`, `wpcomsh`, or `jp-wpcomsh` (see `jp docker phpunit --help` for the full list).
- If you've modified package versions or dependencies between monorepo packages, run `tools/fixup-project-versions.sh` to update lock files before testing.
- If a project's `composer.json` doesn't define `test-js`, the JS test step is skipped automatically — this is normal, not an error.

### What to Test

After modifying a project, run its tests and static analysis:

```bash
jp test php <project>           # PHP tests
jp test js <project>            # JS tests (skipped if not defined)
jp phan <project>               # Static analysis
```

### PHP Testing

- `jp test php` works for most projects. A few plugins that require a full WordPress copy (`plugins/jetpack` and `plugins/wpcomsh`) use `jp docker phpunit` instead.
- **PHP version matrix**: CI runs PHP tests against every supported version from 7.2 to 8.5 (see `.github/versions.sh` for current values). When fixing an issue on one PHP version, ensure the fix is compatible with all supported versions — don't use syntax or functions unavailable in PHP 7.2 unless the project's `composer.json` requires a higher minimum.
- `jp test php` does not support passthrough options like `--filter`. To filter tests in Docker-based projects, use: `jp docker phpunit jetpack -- --filter=Jetpack_Sync_Post_Test` or `jp docker phpunit jetpack -- --group jetpack-sync`
- PHP testing approaches vary by project:
  - Some packages use basic PHPUnit with `yoast/phpunit-polyfills` (no WordPress-specific testing)
  - Some use `brain/monkey` for basic WordPress mocking
  - Some use WorDBless (via `automattic/jetpack-test-environment`) for a lightweight WordPress environment
  - A few plugins use an actual copy of WordPress (these are the `jp docker phpunit` projects)
- For WorDBless-based tests: test classes extend `WorDBless\BaseTestCase`. The `self::factory()` helper is available for creating posts and other objects. For users specifically, prefer `wp_insert_user()` + `get_userdata()` as user factory support varies by project.
- Test class names MUST end in "Test"
- Every test class MUST be in a file with a matching name (e.g., class `My_Unit_Test` in `My_Unit_Test.php`)
- See `projects/packages/connection/tests/php/sso/Helpers_Test.php` for an example of a WorDBless-based test.

See `docs/automated-testing.md` for full testing guidelines.

### JavaScript Testing

- Use Jest with `@testing-library/react`
- Follow WordPress testing patterns for async testing and mocking

See `projects/packages/my-jetpack/_inc/components/connection-status-card/test/component.tsx` for a representative example.

## Changelog Entries

Every PR touching `/projects` MUST include a changelog file in the project's `changelog/` directory. Changes outside `/projects` (e.g., `tools/`, `docs/`, `.github/`) do NOT need changelog entries.

### AI-Generated Changelog Entries

The PR template includes a checkbox: "Generate changelog entries for this PR (using AI)." When checked, a CI workflow uses AI to generate and commit changelog entries automatically. This workflow only runs for pull requests from branches in this repository (not from forks).

**When filling out a PR description:**
- Do NOT check this box if changelog files already exist in `changelog/` directories for the affected projects.
- Do NOT check this box if you have already created changelog entries (e.g., via `jp changelog add`).
- Only check this box if the PR needs changelog entries and you want them auto-generated.
- When in doubt, leave it unchecked -- the bot will flag missing entries.

### Interactive Mode

Run `jp changelog add` and follow the prompts.

### Non-Interactive Mode

```bash
jp changelog add <project> -s <significance> -t <type> -e "<entry>" [-f <filename>]
```

**Parameters:**
- `-s, --significance`: `patch` | `minor` | `major`
- `-t, --type`: `security` | `added` | `changed` | `deprecated` | `removed` | `fixed`
- `-e, --entry`: Changelog entry text
- `-f, --file`: Filename (defaults to git branch name)
- `-c, --comment`: For trivial changes with empty entry, explain why no entry needed

**Examples:**
```bash
# Standard changelog entry
jp changelog add packages/connection -s patch -t fixed -e "Connection: Fix issue with site registration."

# Jetpack plugin (uses different types: major, enhancement, compat, bugfix, other)
jp changelog add plugins/jetpack -s patch -t bugfix -e "Connection: Fix issue with site registration."

# Trivial change (no user-facing entry needed)
jp changelog add packages/connection -s patch -t changed -e "" -c "Update internal documentation"
```

Note: Jetpack plugin uses custom changelog types defined in `projects/plugins/jetpack/composer.json` at `.extra.changelogger.types`.

### Changelog File Format

```
Significance: patch
Type: fixed

Connection: Fix issue with site registration.
```

### Changelog Entry Quality

Entries MUST:
- Be grammatically correct and free of typos
- Start with a capital letter and end with a period
- Use imperative mood (e.g., "Add feature." not "Added feature" or "Adds feature")
- Use a component/feature prefix when the change is specific to a component (e.g., "Connection: Fix timeout issue with site registration.")
- NOT use the package/project name as a prefix within that same package
- Describe the change from a user's perspective, not the implementation details

## Pull Requests

PR descriptions MUST follow the template in `.github/PULL_REQUEST_TEMPLATE.md` — CI checks expect the metadata format defined there.

```bash
gh pr create --title "Title" --body-file pr-body.md --label "[Status] Needs Review" --label "Enhancement" --assignee @me
```

## Code Review Guidelines

When reviewing code, check for:
- Adherence to `docs/coding-guidelines.md`
- Inconsistent naming conventions and typos
- Missing documentation for public APIs
- Missing explanations for complex or non-obvious logic
- Inefficient algorithms
- CSS/SCSS files not using logical properties for RTL

Do NOT suggest modifying `$$next-version$$` placeholders — these are intentionally used and replaced during release.

## Package and API Reuse

Before introducing new dependencies:
- Survey existing packages within the monorepo for similar functionality
- Check for reusable components, utilities, or hooks in shared packages
- Review existing WordPress core and Jetpack APIs
- Prioritize internal packages and APIs over external dependencies

## Common Pitfalls

- **Do NOT edit WordPress core files** — all changes must be in plugins/packages
- **Do NOT modify `$$next-version$$` placeholders** — they are replaced automatically at release time
- **Reuse monorepo packages** before adding external dependencies — check `projects/packages/` and `projects/js-packages/` first
- **Git merge conflicts**: after resolving, use `git commit --no-edit --no-verify` — pre-commit hooks can make unintended changes to merge commit files

## Maintaining This File

If you discover a pattern or pitfall not covered here, mention it to the developer so they can decide whether to update this file.
