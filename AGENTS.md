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

### PHP Standards

- Prefix global PHP functions and hooks with `jetpack_`
- WordPress PHP Coding Standards apply and are enforced by PHPCS (see "Linting & Formatting" below), including nonce verification on form/AJAX handlers and `$wpdb` prepared statements

#### Version Annotations

When adding a version number in a DocBlock, MUST use `$$next-version$$`:

- `@since $$next-version$$`
- `@deprecated $$next-version$$`
- `@deprecated since $$next-version$$`
- `_deprecated_function( __METHOD__, 'package-$$next-version$$' );`

The `$$next-version$$` placeholder is automatically replaced with the correct version at release time. Do NOT replace these with actual version numbers.

### JavaScript & React Standards

- Importing from `react` directly is fine. `@wordpress/element` also works but is no longer required — follow the convention used in the package you're working in
- Use WordPress data stores (`@wordpress/data`) for state management
- Use `@wordpress/i18n` for translations with an appropriate unique text domain
- When using TypeScript with Webpack, use `@babel/preset-typescript` rather than `ts-loader`

### CSS / SCSS

- Use BEM-like naming conventions
- Use CSS logical properties instead of physical direction/dimension mappings to make styles RTL-aware by default (reference: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)

### Comments

One sentence, at most two lines — the summary rule the WordPress documentation standards
already impose on our PHP, applied to JavaScript too. Anything past it must carry a why, a
gotcha, or a durable pointer (an issue or upstream bug link), **and must fit in two more
lines**. The budget is per comment, not per file: three separate traps in one function get three
short comments, not one essay. "It is all rationale" does not buy more room, because the
comments worth cutting are always all rationale. Omit what the signature already says, and
prefer a clearer name over a comment explaining a bad one. If reading the comment costs as much
as reading the code, delete it. Never invent rationale: a comment that contradicts the code is
worse than no comment.

The same budget applies to test files, where it is most often missed: no file-header essays, and
no per-test narration the test name already carries.

Five shapes exceed the budget however well they explain themselves:

- **Design essays** — the alternative you rejected, the paragraph arguing why the code is shaped
  this way, what a trade-off costs. That is PR-description or issue material, not code. A
  one-line warning is a gotcha and stays: `// Do not reorder: bar() reads what foo() sets.`
- **A mechanic explained on one member of a list** whose siblings share it. Say it once above the
  list, or not at all.
- **A block that would survive copy-paste verbatim into another file.** That is domain
  background, not a comment.
- **Provenance that rots** — upstream file-and-line citations, "before this PR…", benchmark
  numbers, mutation-testing counts. A stable link survives; a line number does not.
- **The same explanation in more than one place.** Put it in the file that owns the thing,
  nowhere else. N copies drift independently, so a reader cannot tell which is current.

Keep every functional annotation regardless: `@param`, `@return`, `@covers`, `translators:`,
`phpcs:ignore`, `eslint-disable`, `@ts-expect-error`. Those are required tooling or load-bearing
code, not prose.

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
- **PHP version matrix**: CI runs PHP tests against every supported version from 7.4 to 8.5 (see `.github/versions.sh` for current values). When fixing an issue on one PHP version, ensure the fix is compatible with all supported versions — don't use syntax or functions unavailable in PHP 7.4 unless the project's `composer.json` requires a higher minimum.
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

## Linting & Formatting

Run from the monorepo root:

```bash
pnpm run lint-changed             # ESLint, changed files only (fastest)
pnpm run lint                     # ESLint, everything
pnpm run lint-style               # Stylelint (CSS/SCSS)
pnpm run typecheck                # TypeScript, every project that defines it
composer phpcs:changed            # PHPCS on changed files
composer phpcs:lint               # PHPCS, everything
composer phpcs:fix                # PHPCS autofix (phpcbf)
composer phpcs:compatibility      # PHP cross-version compatibility
```

- `composer php:lint` is a PHP **syntax** check (parallel-lint), NOT PHPCS. The other `php:*` composer scripts (`php:autofix`, `php:changed`, `php:lint:errors`, `php:requirelist`) are deprecated aliases that print a warning — use the `phpcs:*` names.
- Watch the runner: `pnpm run php:lint` is PHPCS (it forwards to `composer phpcs:lint`), while `composer php:lint` is the syntax check. Same name, opposite tool. Prefer the `composer phpcs:*` names above, which are unambiguous.
- A husky **pre-commit hook** runs most of this on staged files and rewrites them in place: Prettier, `eslint --fix`, `stylelint --fix`, and `phpcs:fix`, plus `phpcs:compatibility`, `shellcheck`, and repo consistency checks. It fails the commit on anything left unfixed, so expect files to be reformatted and re-staged under you.
- A husky **pre-push hook** blocks the push on two things the pre-commit hook does not check: filename collisions that only break case-insensitive filesystems, and missing changelog entries (see "Changelog Entries" below). On a TTY the changelog check offers to run `jp changelog add` for you and commits the result as a separate `changelog` commit, then asks you to push again — so a push can leave you one commit ahead of where you thought you were.
- **post-checkout / post-merge** hooks don't run anything; they just print a `jp install ...` line when lock files changed. Run it, or builds pick up stale dependencies.
- `jp draft enable` relaxes both hooks for work in progress — ESLint tolerates up to 100 warnings, PHPCS failures stop blocking, and the pre-push changelog gate is skipped. `jp draft disable` restores them.

## Changelog Entries

Every PR touching `/projects` MUST include a changelog file in the project's `changelog/` directory. Changes outside `/projects` (e.g., `tools/`, `docs/`, `.github/`) do NOT need changelog entries.

Two gates enforce this, both running `tools/check-changelogger-use.php`: the pre-push hook (see "Linting & Formatting" above) and the `linting.yml` CI job. The repo-gardening bot also comments on the PR listing any projects still missing entries. There is no AI-generated-changelog checkbox in the PR template — that feature was removed. Write the entries yourself, with `jp changelog add`.

### User-Facing Changes Outside a Plugin Also Need Plugin Entries

An entry only lands in the CHANGELOG of the project it was added to. A PR confined to a shared project — a PHP package under `projects/packages/`, a JS package under `projects/js-packages/`, or any other non-plugin project — therefore reaches that project's CHANGELOG and nowhere else: the plugins that bundle it get, at most, the generic "Update package dependencies." line the release tooling files under "Other changes", which is never copied to `readme.txt`. Users, release posts, and support documentation read the plugin changelog, so the change is invisible to them.

**When a change to a package or js-package is user-facing — a new block, new or changed UI, a behavior change, a bug fix someone would notice — add an entry to each plugin whose own users would notice it, on top of the project's own entry.** That is usually a subset of the plugins that bundle the project, sometimes just one — though a change to something a shared dashboard renders can legitimately reach most of them. Write each one from that plugin's user's perspective; the wording rarely needs to be identical.

Over-reporting is not free: it puts a line about a product the plugin does not ship into a changelog and `readme.txt` that its users do read.

Prefix each plugin's entry with the product the shared project backs — `Premium Analytics:` for `packages/premium-analytics`, `Search:` for `packages/search` — so readers of a plugin changelog that bundles many products can place the change. The exception is a plugin named for that same product (`plugins/premium-analytics`, `plugins/search`): there the prefix would only repeat the plugin's own name, so leave it off (or use a narrower component prefix), as in the example below.

Start from the plugins that bundle the project (works the same for `packages/…` and `js-packages/…`):

```bash
jp dependencies list packages/search --add-dependents --extra build --no-dev | grep '^plugins/'
jp dependencies list js-packages/components --add-dependents --extra build --no-dev | grep '^plugins/'
```

Then narrow that list. A widely-shared js-package can list well over a dozen plugins; add an entry for one only when a user of *that plugin* could notice the change. Skip it when:

- **The change belongs to another product and this plugin only contains it via a My Jetpack product card.** A change to a My Jetpack product card belongs in the changelogs of the plugins that ship that product. Every other plugin renders the card only for someone who already has that product, and they read about it in that product's changelog. Check that the card really is the only route, though: `js-packages/boost-score-api` sits behind the Boost card, but `plugins/jetpack` also calls it straight from At a Glance, so a change there reaches Jetpack plugin users too.
- **The plugin never reaches the changed code.** `js-packages/components` is a build dependency of nearly every plugin in the monorepo, but `DiffViewer` reaches only `plugins/protect`.
- **It is reachable only under conditions the plugin never creates** — a module it does not register, a plan or product it does not sell, or a host it does not run on. Check the gate rather than the dependency, because the same code can qualify for one plugin and not another: the WordPress.com-only paths in `packages/masterbar` never run on a self-hosted site, but they are the whole reason `plugins/wpcomsh` bundles the package.
- **The plugin's changelog is not a product record.** `starter-plugin` is a scaffolding template, and `mu-wpcom-plugin` is the wrapper that exists so `packages/jetpack-mu-wpcom` can be deployed to WordPress.com Simple at all (it doubles as a test plugin for the package). Nobody installs either one, so nobody reads either changelog to find out what changed on their site — what a Simple site owner would notice belongs in the package's own entry. Keep this one narrow: it is about those two, not about any plugin you have not heard of.

To settle the reachability case, work backwards from the code rather than forwards from the plugin. Grepping `projects/plugins/<plugin>/` alone misses a plugin that is little more than a loader for a package, and grepping its whole dependency closure always matches, since the project that defines the symbol is in every dependent's closure. Find the projects that import it, then ask which plugins bundle *those* — every one except the project that defines the symbol, which is in the grep output too and would hand back its full set of dependents. Run one `jp dependencies list` per lead rather than passing every lead to a single command: it is the lead a plugin arrives on that you then have to argue with, and merging them hides which lead carried which plugin.

```bash
git grep -l DiffViewer -- projects/ ':!*/CHANGELOG.md'
jp dependencies list js-packages/scan --add-dependents --extra build --no-dev | grep '^plugins/'
jp dependencies list plugins/protect --add-dependents --extra build --no-dev | grep '^plugins/'
```

Use `git grep`, not `grep -r`. A checkout you have built or run `composer install` in carries the symbol in webpack caches and in `vendor/composer/*classmap.php`, and those classmaps name every class in a plugin's whole dependency closure — so `grep -r` on a PHP symbol hands back every dependent plugin, which is the answer this section exists to talk you out of. Exclude `CHANGELOG.md` while you are there: a changelog naming the symbol is a record that a project once touched it, not a lead that it still does.

What that gives you is a shortlist, not an answer. Bundling a project is not the same as rendering its code, which is the distinction the whole section turns on, so finish the job by hand, one lead at a time. `DiffViewer` is the cautionary case. The `js-packages/scan` lead offers `plugins/protect` and `plugins/jetpack` and settles neither: that package touches `DiffViewer` only inside `ThreatModal`, which is barrel-exported and then rendered by nothing outside its own story — `packages/scan`, the Jetpack plugin's only route to the package, imports `ThreatsDataViews` and `ThreatSeverityBadge` and never `ThreatModal`. `plugins/protect` survives on the other lead entirely, where it imports `DiffViewer` from `@automattic/jetpack-components` itself. So a `DiffViewer` change is noticeable in `plugins/protect` alone — but not by the route the dependency graph suggested, which is why the leads are worth keeping apart.

Then add one entry per plugin that survives. Each project defines its own types — `plugins/jetpack` uses `major` | `enhancement` | `compat` | `bugfix` | `other`:

```bash
jp changelog add packages/search -s minor -t added       -e "Add a Search Results block."
jp changelog add plugins/search  -s minor -t added       -e "Add a Search Results block."
jp changelog add plugins/jetpack -s minor -t enhancement -e "Search: Add a Search Results block."
```

**The non-interactive form never prompts for this.** Naming a project (`jp changelog add <project> -s … -t … -e …`) disables the indirect-plugin check, so dependent plugins are silently skipped; only bare `jp changelog add` offers to write those entries for you. Using the non-interactive form means adding the plugin entries yourself — or running `jp changelog add --check-indirect-plugins` afterwards to be asked.

**And the prompt it does show is all-or-nothing.** It lists every indirectly-affected plugin at once and asks a single yes/no. A `yes` hands the whole list to the same prompts the main run uses, which choose between one shared entry and individual wording — never between plugins. When only some of the list qualifies, answer `no` and add those entries yourself with the non-interactive form.

The project's own entry alone is correct only when nothing is observable to a site owner: internal refactors, tests, tooling, type fixes.

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

### Re-running CI Checks

Most CI checks can be re-run with the usual `gh` commands (e.g. `gh run rerun <run-id> --failed`, or `gh pr checks`).

The exception is the **WordPress.com Tests** check (the TeamCity `JetpackPreFlightChecks_BasicChecks` build). It cannot be restarted via the GitHub UI or the `gh` CLI. When that check fails on something unrelated to your change, re-trigger it with the context-a8c command:

```
/context-a8c:rerun-jetpack-preflight <PR-number>
```

## Code Review Guidelines

When reviewing code, check for:
- Adherence to `docs/coding-guidelines.md`
- Changelog entries in the wrong set of plugins — a user-facing package change missing an entry in a plugin that surfaces it, or an entry added to plugins that cannot reach the change at all (see "User-Facing Changes Outside a Plugin Also Need Plugin Entries" above). CI only checks the directly-touched project, so both directions are reviewer-only
- Missing documentation for public APIs, or missing explanations for non-obvious logic
- Typos in user-facing strings, comments, and docs — PHPCS and ESLint check naming and formatting, not spelling, so this needs human eyes
- Performance hazards that no sniff catches: uncached `wp_remote_*` calls, queries inside loops, `meta_query`/`tax_query`/`orderby => rand` on large tables, and newly autoloaded options. `WordPress.DB.SlowDBQuery` is excluded from the Jetpack ruleset as too noisy, so this is reviewer-only
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
- **Git merge conflicts**: after resolving, use `git commit --no-edit --no-verify` — pre-commit hooks can make unintended changes to merge commit files
- **Do NOT hand-edit generated Phan stubs** — `.phan/stubs/wpcom-stubs.php` (and other generated stub files) are regenerated from the wpcom repo; any manual edit is overwritten. See *Referencing wpcom-only symbols from Jetpack* below.

## Referencing wpcom-only symbols from Jetpack (Phan stubs)

When Jetpack code calls a class or function that ships only from wpcom (not present in this repo), Phan flags `PhanUndeclared{Class,ClassMethod,Function}`. Do NOT just silence it permanently. See also `docs/monorepo.md` § Static Analysis → *Referencing wpcom-only symbols*. The correct order is:

1. **Add the symbol to the wpcom stub definitions** — `bin/teamcity-builds/jetpack-stubs/stub-defs.php` in the wpcom repo. This is the source that Jetpack's `.phan/stubs/wpcom-stubs.php` is regenerated from.
2. **Get the regenerated stubs merged into Jetpack first** — triggering the *Jetpack Staging → Update WPCOM Stubs* job in TeamCity opens a "phan: Update wpcom stubs" PR. Land that before your feature PR.
3. **Rebase your feature PR** on trunk so it picks up the new stubs.
4. **Remove the suppression** — the symbol is now declared, so Phan passes without it.

An inline `@phan-suppress-next-line <Rule> -- <reason>` is acceptable ONLY as a temporary bridge until step 2 lands, and MUST carry a `-- <reason>` justification.

**Gotchas:**
- The "phan: Update wpcom stubs" PR is machine-generated and gets rebased/recreated on every job run — never hand-edit it, your changes will be overwritten.
- `.phan/stubs/wpcom-stubs.php` is likewise generated (its header says so). Never edit it directly to add a symbol — add it to `stub-defs.php` in wpcom instead.

## Maintaining This File

If you discover a pattern or pitfall not covered here, mention it to the developer so they can decide whether to update this file.
