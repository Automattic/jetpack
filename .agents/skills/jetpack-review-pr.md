---
description: Review a Jetpack pull request for bugs, security, performance, convention compliance, and test coverage
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr list:*), Bash(gh auth:*), Bash(jp test:*), Bash(jp docker:*), Bash(jp phan:*), Bash(jp build:*), Bash(jp install:*), Bash(git fetch:*), Bash(git worktree:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git rev-parse:*), Bash(grep:*), Bash(timeout:*), Bash(mktemp:*), Read, Glob, Grep, Agent
---

Review a Jetpack pull request for code quality, bugs, security, performance, Jetpack conventions, and test adequacy.

## Input

The user provides a PR number or URL (e.g., `#12345` or a GitHub URL). If no PR is specified, review the current branch's open PR.

Optionally, the user can specify a review depth: `quick`, `standard`, or `thorough`. If not specified, the depth is auto-detected from the PR size after fetching metadata (step 1).

## Review depth

| Depth | When (auto) | Typical time | What it does |
|-------|-------------|--------------|--------------|
| **quick** | <50 lines changed, single project, no security-sensitive files | ~30-60s | Diff-only. Checks: changelog, conventions, obvious bugs, backward compat. Compact output. |
| **standard** | 50–500 lines changed, or multiple projects | ~2-4 min | Reads full files for context. Checks all applicable categories by file type. Compact or full output based on findings. |
| **thorough** | >500 lines, or security-sensitive files, or user requests it | ~10-15 min | Everything. Worktree, tests, phan, full files, cross-project deps, codebase-wide copy search. Full output. |

**Security-sensitive patterns auto-upgrade depth** (`quick` → `standard`, `standard` → `thorough`):
- Diff contains `$wpdb->`, `register_rest_route`, `current_user_can`, `wp_verify_nonce`
- Files in `**/rest-api/**`, `**/endpoints/**`, or named `*-endpoint.php`
- Diff adds/modifies capability checks, nonce verification, or SQL queries

When auto-upgraded, report it: "Auto-upgraded to **standard** — diff contains `register_rest_route`"

User overrides are always respected without question, including downgrades.

## Steps

### 1. Fetch PR context and detect depth

**A) Fetch metadata and diff in parallel** (all depths):
```bash
gh pr view <PR> --json number,title,body,headRefName,baseRefName,files,additions,deletions,author,state,isDraft
gh pr diff <PR>
gh pr view <PR> --json headRefOid --jq '.headRefOid'
```

If any of these commands fail, stop immediately and report the error. Do not proceed with partial data. Common failures: invalid PR number, `gh` auth expired (run `gh auth status`), network issues.

**General rule**: If any command fails during the review, always report the failure and what it means for the review. Never silently skip a check.

**B) Preliminary checks** — before anything else:
- Closed without merge → stop, tell the user
- Merged → proceed with post-merge review
- Draft → warn, continue
- Trivially automated (dependency bumps with no manual code) → stop
- **Docs/CI-only** (changes only in `.agents/`, `.claude/`, `docs/`, `tools/`, `.github/`, or only changelog files) → stop, tell the user "Only docs/CI files changed. Skipping code review. Re-run with `standard` depth to force a review." If the user explicitly requested a review of these files, proceed anyway.

**C) Auto-detect depth** (if not specified by user):
- `total_changes = additions + deletions`
- Count affected projects
- Scan diff for security-sensitive patterns
- Select depth and report: "Review depth: **quick** (28 lines, 1 project)"

**D) Identify affected projects** by grouping changed files under `projects/<type>/<name>`.

**E) Classify file types** (from the file list — no need to read content):
- `has_php`: `.php` files changed
- `has_js`: `.js`, `.jsx`, `.ts`, `.tsx` files changed
- `has_css`: `.css`, `.scss` files changed
- `has_deps`: `composer.json` or `package.json` files changed

For standard + thorough only (requires reading the diff):
- `has_html`: diff contains HTML tags in PHP/JSX files, or `.html` files changed
- `has_strings`: diff contains `__()`, `_e()`, `_x()`, `_n()`, `esc_html__()`, `esc_attr__()`

**F) Set up worktree** (thorough only):
```bash
# Clean up stale state from previous failed reviews
git worktree remove pr-review-<PR_NUMBER> 2>/dev/null || true
git branch -d pr-review-<PR_NUMBER> 2>/dev/null || true

WORKTREE_DIR=$(mktemp -d)
git fetch origin pull/<PR_NUMBER>/head:pr-review-<PR_NUMBER>
git worktree add "$WORKTREE_DIR" pr-review-<PR_NUMBER>
```
If setup fails:
- The Test Results section must say: "**FAILED**: Could not set up worktree — [error]. Tests were NOT executed."
- The Verdict must note: "Thorough review requested but tests could not be executed."
- Fall back to diff-only analysis for the remainder of the review.

**G) Read project-specific CLAUDE.md** files for affected projects (standard + thorough).

Note: `AGENTS.md` is already loaded in your context via the CLAUDE.md `@AGENTS.md` directive — do not re-read it.

### 2. PR description review

**Quick**: Only check confidentiality (no private `*.wordpress.com` URLs).

**Standard + thorough**: Review the PR description against `.github/PULL_REQUEST_TEMPLATE.md`:
- **Proposed changes**: Filled in and accurate? Flag if vague or missing.
- **Testing instructions**: Present and specific? Flag if missing or "N/A" for non-trivial changes.
- **Data/privacy**: If the diff introduces tracking, analytics, or data collection, flag if the PR description doesn't acknowledge it. Check if `[Status] Needs Privacy Updates` label is needed.
- **Confidentiality**: No private WordPress.com URLs. P2 shorthand required.

### 3. Convention compliance

**All depths** check:

- **Changelog**: Every PR touching `projects/` must have a changelog entry. Verify entry quality (capital letter, period, imperative mood, correct significance/type).
- **Version annotations**: New `@since`/`@deprecated` tags must use `$$next-version$$`. Do NOT flag existing `$$next-version$$`.
- **Naming**: PHP uses `jetpack_` prefix, lowercase with underscores. JS uses ES6+, `@wordpress/element`, `@wordpress/i18n`. CSS uses BEM-like naming.

**Standard + thorough** also check:

- **CSS logical properties** (if `has_css`): Prefer CSS logical properties over physical direction properties (`margin-left` → `margin-inline-start`). Exceptions: viewport-relative positioning, animations, and other cases where physical properties are intentional.
- **Package reuse**: Flag new external deps that duplicate monorepo packages. Check `@wordpress/data` for state, `@wordpress/i18n` for translations.
- **Dependency changes** (if `has_deps`): Necessity, GPL license compat, version constraints, modified build scripts.

### 4. Code review

**Every finding MUST include:**
1. `[blocker]` or `[suggestion]` prefix — no exceptions
2. A GitHub permalink: `https://github.com/Automattic/jetpack/blob/<SHA>/<path>#L<start>-L<end>`
3. A brief explanation and concrete fix suggestion

**What to check at each depth:**

| Category | quick | standard | thorough |
|----------|-------|----------|----------|
| Bugs (from diff) | yes | yes | yes |
| Bugs (read full files) | no | yes | yes |
| Security patterns | yes | yes | yes |
| Security threat model | no | if security files | yes |
| Backward compat | yes | yes | yes |
| Cross-package version skew (optional-sibling calls) | yes | yes | yes |
| Phan suppressions / baseline growth (from diff) | yes | yes | yes |
| Error handling | no | yes | yes |
| Feature gating | no | yes | yes |
| HTML / a11y / RTL | no | if has_html/has_css | yes |
| Translations | no | if has_strings | yes |
| Copy consistency (grep codebase) | no | no | yes |
| Code simplicity / WP reuse | no | yes | yes |
| WP/PHP version compat | no | yes | yes |

---

#### Bugs, security, and backward compatibility

*Bugs* (quick: diff-only, standard+thorough: read full files):
- Logic errors, off-by-one, null/undefined access, race conditions
- Incorrect hook priorities or missing hook cleanup
- Interactions with surrounding code the diff doesn't show (standard + thorough only)

*Security patterns* (all depths):
- SQL injection (`$wpdb->query()` without `$wpdb->prepare()`)
- XSS (unescaped output — must use `esc_html()`, `esc_attr()`, `wp_kses()`, etc.)
- CSRF (missing nonce verification on state-changing actions)
- Missing capability checks, command injection

*Security threat model* (thorough, or standard if security-sensitive files):
- What trust boundaries does this code cross?
- Could an attacker influence the inputs? What's the worst outcome?
- Are gating mechanisms reliable for security decisions? Environment type (`wp_get_environment_type()`) is a site-owner configuration, not an access control mechanism — do not use it as a security gate.
- Authorization based on capabilities (reliable) vs environment/config (not access control)?

*Error handling* (standard + thorough):
- PHP should return `WP_Error` in WP contexts, not exceptions (unless project uses exception patterns)
- REST endpoints must return proper HTTP status codes
- JS async code must handle rejection
- User-facing error states should be graceful

*Backward compatibility* (all depths — this catches fatal errors):
- **Removed public methods/functions**: Must deprecate with `_deprecated_function()` + `$$next-version$$` first. Flag as `[blocker]`.
- **Removed/renamed hooks**: Must use `apply_filters_deprecated()` / `do_action_deprecated()`
- **Changed signatures**: New params must be optional with defaults. Required params break callers. `[blocker]`.
- **Removed REST endpoints**: Must version or deprecate
- **Removed public constants/properties**: Fatal errors in consumers
- Scan diff for removed lines with `public function`, `function jetpack_`, `do_action(`, `apply_filters(`, `register_rest_route`

*Cross-package version skew — calls into optional sibling packages* (all depths — this catches fatal errors):

A monorepo package may call into another package it does NOT list in its own `composer.json` `require` (e.g. my-jetpack → `SEO\Initializer`, `Search\*`, `VideoPress\*`). On trunk every package is at the same version, so the call resolves and CI passes. But standalone plugins (Social, Boost, VideoPress, Protect, …) each bundle their own `jetpack_vendor/` copies, and jetpack-autoloader loads ONE copy of each shared package across all active plugins — frequently an OLDER version than trunk. The symbol you call may not exist at runtime.

- **`class_exists()` is NOT a sufficient guard** when you then call a method, read a constant, or access a property on that class. The class can load from an older bundled copy that predates the member → `Call to undefined method` fatal. Guard the EXACT symbol you use:
  - method → `method_exists( $class, 'method' )` or `is_callable()`
  - constant → `defined( "$class::CONST" )`
  - function → `function_exists()`
  - property → `property_exists()`
- `[blocker]`: a newly-added call into a non-`require`d sibling package guarded only by `class_exists()` (or unguarded). The same PR often adds both the new symbol (in package A) and its caller (in package B), so the diff looks self-consistent — the skew only appears across release trains. Check the guard, not the definition; an internally-consistent diff does not prove the symbol ships together everywhere.
- Detection:
  ```bash
  # Cross-package class references added in this diff:
  gh pr diff <PR> | grep -nE '^\+.*\\Automattic\\Jetpack\\[A-Z][A-Za-z]+\\'
  # For each referenced package, confirm it is in THIS project's composer.json "require":
  grep '"automattic/jetpack-<pkg>"' projects/<type>/<name>/composer.json \
    || echo "OPTIONAL sibling — any method/constant/property access needs a symbol-level guard"
  ```
- Precedent: SOCIAL-515 (`SEO\Initializer::is_optin_available()` fatal on Social 9.0.2 standalone), MYJP-308 (Search product fatal on plugins not bundling jetpack-search). Both: `class_exists()` passed, the method was absent from the bundled copy.

*Static analysis suppressions — don't silence Phan instead of fixing it* (all depths — diff-visible, can hide fatals):

`jp phan` (the monorepo's PHP static analyzer) runs in CI and must stay green. The shortcut to a green run is to *silence* an error rather than fix it — and a silenced `PhanUndeclared*`, undefined-variable, deprecated-call, or type-mismatch is frequently a real runtime bug (often the same version skew as above) hidden from CI. A PR should make Phan pass by fixing code, not by suppressing it. **Treat a newly-added suppression as a finding in its own right — report it even when you cannot independently confirm the underlying bug, and ask for a fix or a written justification.**

Scan the diff for both silencing mechanisms:
- **New inline suppressions**: `@phan-suppress-next-line`, `@phan-suppress-current-line`, `@phan-suppress` (docblock), `@phan-file-suppress` (whole file).
- **Baseline growth**: added entries, or raised "N occurrences" counts, in any `.phan/baseline.php`. The baseline exists only to grandfather *pre-existing* debt for incremental fixing — a PR should shrink or hold it, never grow it. A new baseline entry means the PR is hiding an error it just introduced.

Severity:
- `[blocker]`: the suppressed issue is a real defect — `PhanUndeclared{Method,ClassMethod,Function,StaticMethod}` (symbol may be absent at runtime — see Cross-package version skew above), `PhanPossiblyUndeclaredVariable`/`PhanUndeclaredVariable` (use-before-init), `PhanDeprecated*` (removed in a future PHP or dependency version), or a `PhanTypeMismatch*` on a security/data path. Fix the code and drop the suppression.
- `[suggestion]`: a plausible false positive whose inline suppression carries no `-- <reason>` justification. Jetpack convention is that every legitimate suppression states why it is safe, e.g. `// @phan-suppress-current-line PhanUndeclaredFunction -- Guarded by function_exists().` An unexplained suppression can't be reviewed.
- Discard only when it is a documented false positive WITH a justification comment and the code is provably safe.

Detection:
```bash
# Inline suppressions added by this PR:
gh pr diff <PR> | grep -nE '^\+.*@phan-(suppress|file-suppress)'
# If the file list includes any .phan/baseline.php, inspect its hunk: every added
# 'Phan...' entry or raised "N occurrences" count is a newly-hidden error.
```

*Feature gating* (standard + thorough):
- New user-facing features (admin pages, blocks, endpoints) should be gated behind feature flags for staged rollout. Flag if ungated.

---

#### HTML, accessibility, and RTL (standard if has_html/has_css, thorough always)

*HTML structure:*
- Tag hierarchy changes that could break selectors or third-party integrations
- Semantic element changes (`<article>` → `<div>`)
- Removed/renamed IDs or data attributes used as JS hooks

*Accessibility:*
- Missing `aria-*` on interactive elements, `alt` on images, `<label>` on inputs
- Non-semantic click handlers on `<div>`/`<span>` without `role`/`tabIndex`/keyboard handlers
- Heading level skips, color contrast concerns, focus management

*RTL:*
- Physical direction CSS properties → use logical properties
- Inline styles with physical directions
- Hardcoded directional icons, physical-direction class names

---

#### Translations, copy, and UX writing (standard if has_strings, thorough always)

*Translations:*
- All user-facing strings wrapped in translation functions with correct text domain
- No concatenated fragments — use `sprintf()` with ordered placeholders (`%1$s`, `%2$s`)
- `_x()` for ambiguous strings, `_n()` for plurals
- Minimize HTML inside translation strings; use `sprintf()` to inject variables and URLs. If HTML is necessary, keep it to simple inline tags and sanitize output with `wp_kses()`.
- JS uses `@wordpress/i18n`

*Copy quality* (thorough only does codebase grep for similar patterns):
- Grep the codebase for how existing UI labels handle similar concepts — flag inconsistent terminology
- Button labels should be specific ("Save changes" not "Save")
- Error messages should explain what happened AND what to do
- No jargon or internal naming in user-facing strings
- Suggest concrete alternatives matching existing project conventions

---

#### Code simplicity, WP/PHP compatibility, and reuse (standard + thorough)

*WordPress/Gutenberg reuse:*
- Flag new utilities duplicating WP core: `wp_list_pluck`, `sanitize_text_field`, `wp_date`, `esc_url`, `wp_cache_get`, `current_user_can`, `get_option`, etc.
- Flag JS duplicating `@wordpress/*`: `@wordpress/data`, `@wordpress/api-fetch`, `@wordpress/notices`, `@wordpress/components`
- Check for duplication within `projects/packages/` and `projects/js-packages/`

*Simplicity:*
- Flag deep nesting, unnecessary abstractions, wrapper functions adding no value
- Prefer WordPress patterns over custom (e.g., `register_rest_route` over custom routing)

*WP version compatibility:*
```bash
# Determine minimum WP version dynamically
grep -m1 'JETPACK__MINIMUM_WP_VERSION' projects/plugins/jetpack/jetpack.php
# Find the main plugin file dynamically
grep -rl 'Plugin Name:' projects/plugins/<affected-plugin>/*.php
grep -m1 'Requires at least:' projects/plugins/<affected-plugin>/<main-file>.php
```
- Look up `@since` tags in WP core or `wordpress-stubs` for any new WP function in the diff
- Flag functions newer than the project's minimum WP version

*PHP version compatibility:*
```bash
grep -m1 'JETPACK__MINIMUM_PHP_VERSION' projects/plugins/jetpack/jetpack.php
grep 'MIN_PHP_VERSION' .github/versions.sh
```
- Verify PHP syntax/builtins are available at the minimum version
- Check project's own `composer.json` `require.php` — may differ from monorepo default
- Common traps (non-exhaustive): typed properties (7.4+), arrow functions (7.4+), named args (8.0+), match (8.0+), `str_contains()`/`str_starts_with()`/`str_ends_with()` (8.0+, polyfilled by WP since 5.9 — check project's minimum WP version), enums (8.1+), readonly properties (8.1+), `array_is_list()` (8.1+, NOT polyfilled by WP), readonly classes (8.2+), `json_validate()` (8.3+)

### 5. Cross-project dependency check

**Quick**: skip. **Standard**: only if a package changed. **Thorough**: always.

```bash
grep -r "automattic/jetpack-<package-name>" projects/*/*/composer.json
grep -r "@automattic/jetpack-<package-name>" projects/*/*/package.json
```

Flag changes that could break consumers (changed signatures, removed methods, altered return types). List affected downstream projects.

**Upstream direction too:** if the diff *adds* a call into a monorepo package this project does NOT `require`, that call is subject to version skew on standalone installs — apply the *Cross-package version skew* check from step 4.

### 6. Test and static analysis (thorough only)

Identify the test runner for each project and **always report it**, even when skipped:
- `plugins/jetpack`, `plugins/wpcomsh` → `jp docker phpunit <target>`
- Everything else → `jp test php <project>` / `jp test js <project>`

Run in the worktree with 5-minute timeouts:
```bash
cd "$WORKTREE_DIR"
timeout 300 jp test php <project>      # or: jp docker phpunit <target>
timeout 300 jp test js <project>
timeout 300 jp phan <project>
```

After each test command, check the exit code:
- Exit 0: Tests passed
- Exit 124: Tests timed out (5 min limit) — report as infrastructure issue, not a code problem
- Other non-zero: Tests failed — include the last 50 lines of output

If deps are missing, `jp install <project>` and retry once.

If `jp phan` passes only because the diff added `@phan-suppress` annotations or grew `.phan/baseline.php`, that is itself a finding — apply *Static analysis suppressions* from step 4. A green Phan run earned by suppression is not a passing Phan run.

**Test quality review** (read new/modified test files):
- Coverage: are new public functions/endpoints tested?
- One assertion per concept, flat structure, no logic in tests
- Descriptive names, minimal setup, clear arrange/act/assert
- Prefer integration tests over heavy mocking (WorDBless > mocks)
- Data providers over copy-pasted test methods
- Test behavior, not implementation details
- Compare with neighboring test files for style consistency

### 7. Compile findings

Assign severity to each finding:
- **Discard**: False positive, pre-existing issue, intentional pattern, or linter-catchable — do not include
- **`[suggestion]`**: Improvement worth making but not blocking (style, minor simplification, non-critical edge case)
- **`[blocker]`**: Likely production impact — bugs, security issues, backward-compat breaks, data loss risk

### 8. Clean up (thorough only)

```bash
git worktree remove "$WORKTREE_DIR" --force || echo "WARNING: Failed to remove worktree at $WORKTREE_DIR"
git branch -d pr-review-<PR_NUMBER> || echo "WARNING: Failed to delete branch pr-review-<PR_NUMBER>"
```

If cleanup fails, warn the user and provide the manual cleanup commands.

### 9. Present results

**Compact format** — use when fewer than 3 findings, or depth is `quick`:

```
Review depth: **<depth>** (<lines> lines, <N> projects)

## PR Review: #<number> — <title>

### Summary
<1-2 sentences>

### Affected Projects
<list>

### PR Description
<"Looks good" or issues>

### Changelog
<"Present and valid" or issues>

### Findings
<numbered list with [blocker]/[suggestion] prefix, or "No issues found.">

### Other Checks
<single line: "Security, Performance, Backward Compat, ...: all clear">

### Test Results
- PHP: <status — always note runner needed, e.g., "Skipped (requires jp docker phpunit wpcomsh)">
- JS: <status>
- Phan: <status>

### Verdict
<verdict>

---
Reviewed <N> files, <M> lines changed. Checked: <categories evaluated>.
```

**Full format** — use when 3+ findings:

```
Review depth: **<depth>** (<lines> lines, <N> projects)

## PR Review: #<number> — <title>

### Summary
### Affected Projects
### PR Description
### Changelog
### Convention Issues
### Bugs
### Security
### Performance
### Error Handling
### HTML Structure Changes
### Accessibility
### RTL Issues
### Translation Issues
### Copy Review
### Code Simplicity / WordPress Reuse
### Dependency Changes
### PHP / WordPress Version Compatibility
### Feature Gating
### Data / Privacy
### Backward Compatibility / Removed Public API
### Cross-Package Version Skew
### Phan Suppressions
### Cross-Project Impact
### Test Results
### Test Coverage Gaps
### Test Quality
### Verdict

---
Reviewed <N> files, <M> lines changed. Checked: <categories evaluated>.
```

Each section: numbered findings with `[blocker]`/`[suggestion]` prefix, or "None found". Sections that were skipped due to depth should not appear.

**Verdict rules:**
- **"Needs changes before merge"**: Any `[blocker]`
- **"Minor issues — can merge after addressing"**: No blockers, but `[suggestion]`(s) exist
- **"Looks good"**: No blockers, no suggestions
