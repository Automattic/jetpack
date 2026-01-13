# Jetpack Monorepo - Claude Code Instructions

@.cursor/rules/
@.github/copilot-instructions.md

## Jetpack CLI (`jp`)

The `jp` command runs `pnpm jetpack` inside the monorepo Docker container. Install globally: `npm install -g @automattic/jetpack-cli`

### Common Commands

```bash
jp build plugins/jetpack          # Build a project
jp build plugins/jetpack --deps   # Build with dependencies
jp watch plugins/jetpack          # Watch and rebuild on changes
jp test php plugins/jetpack       # Run PHP tests
jp test js plugins/jetpack        # Run JS tests
jp changelog add                  # Add changelog entry (interactive)
jp generate                       # Create new project (interactive wizard)
jp install plugins/jetpack        # Install project dependencies
jp clean plugins/jetpack          # Clean build artifacts
jp docker up -d                   # Start Docker environment
jp docker install                 # Install WordPress in Docker
jp phan                           # Run PHP static analysis
```

## Creating New Projects

Use `jp generate` to create new projects. The wizard walks you through creating:
- **Plugins**: `jp generate plugin --name my-plugin`
- **Packages**: `jp generate package --name my-package`
- **JS Packages**: `jp generate js-package --name my-js-package`
- **GitHub Actions**: `jp generate github-action --name my-action`

For plugins, you can choose the "Starter plugin" template which includes a working example with React admin page, or "Blank plugin" for minimal scaffolding.

## Changelog Entries (Required for PRs)

Every PR touching `/projects` needs a changelog file in the project's `changelog/` directory.

**Note:** Changes outside `/projects` (e.g., `tools/`, `docs/`, `.github/`, `.claude/`) do NOT need changelog entries.

### Interactive Mode
Run `jp changelog add` and follow the prompts.

### Non-Interactive Mode (for automation)
```bash
jp changelog add <project> -s <significance> -t <type> -e "<entry>" [-f <filename>]
```

**Parameters:**
- `-s, --significance`: `patch` | `minor` | `major`
- `-t, --type`: `security` | `added` | `changed` | `deprecated` | `removed` | `fixed`
- `-e, --entry`: Changelog entry text (format: "Component: description starting with verb.")
- `-f, --file`: Filename (defaults to git branch name)
- `-c, --comment`: For trivial changes with empty entry, explain why no entry needed

**Examples:**
```bash
# Standard changelog entry
jp changelog add packages/connection -s patch -t fixed -e "Connection: fix issue with site registration."

# Jetpack plugin (uses different types: major, enhancement, compat, bugfix, other)
jp changelog add plugins/jetpack -s patch -t bugfix -e "Connection: fix issue with site registration."

# Trivial change (no user-facing entry needed)
jp changelog add packages/connection -s patch -t changed -e "" -c "Update internal documentation"
```

Note: Jetpack plugin uses custom changelog types defined in `projects/plugins/jetpack/composer.json` at `.extra.changelogger.types`.

### Changelog File Format
```
Significance: patch
Type: fixed

Connection: fix issue with site registration.
```

For trivial changes:
```
Significance: patch
Type: changed
Comment: Update internal documentation, no user-facing changes.
```

## Creating Pull Requests

PR descriptions must follow the template in @.github/PULL_REQUEST_TEMPLATE.md - CI checks expect the metadata format defined there.

```bash
gh pr create --title "Title" --body-file pr-body.md --label "[Status] Needs Review" --label "[Type] Enhancement" --assignee @me
```

## Project Structure

- `projects/plugins/` - WordPress plugins
- `projects/packages/` - Composer/PHP packages
- `projects/js-packages/` - JavaScript/npm packages
- `projects/github-actions/` - GitHub Actions
- `tools/` - Monorepo tooling
- `docs/` - Documentation

## Build Scripts in composer.json

Projects define build steps in `composer.json`:
- `.scripts.build-production` - Production build (set `NODE_ENV=production`)
- `.scripts.build-development` - Development build
- `.scripts.test-php` - PHP tests
- `.scripts.test-js` - JavaScript tests

## Testing

```bash
jp test php <project> -v    # PHPUnit tests (with output)
jp test js <project>        # Jest tests
jp test coverage <project>  # Generate coverage report
```

PHP tests use PHPUnit with `yoast/phpunit-polyfills`. JS tests use Jest with `@testing-library/react`.

## Environment Variables

- `FORCE_PULL=1` - Force pull latest Docker image
- `BUILD_LOCAL=1` - Build Docker image locally
- `DEBUG=1` - Enable debug output