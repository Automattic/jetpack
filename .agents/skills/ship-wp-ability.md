---
name: ship-wp-ability
description: "Use when shipping a new set of WP Abilities for a Jetpack plugin or package — scaffolds a Registrar-extending class, permissions, input/output schemas, PHPUnit tests (including Registrar-wiring assertions), bootstrap wiring, and a changelog entry."
compatibility: "Targets WordPress 6.9+ (PHP 7.2.24+). Requires the `jetpack-wp-abilities` package (`projects/packages/wp-abilities`). Filesystem-based agent with bash."
---

# Ship WP Ability

## When to use

Use this skill when the task is to ship a new set of WP Abilities for:

- a Jetpack module exposed through the main plugin (`projects/plugins/jetpack/`),
- a Jetpack package with its own abilities surface (`projects/packages/forms`, `boost`, `search`, `stats`, ...),
- any feature that needs to be callable via `wp-abilities/v1` or `@wordpress/abilities`.

Typical invocations:

- `/ship-wp-ability for jetpack modules`
- `/ship-wp-ability for Forms responses`
- `/ship-wp-ability for Boost cache`

If the task is *designing* which abilities to register (grouping, naming, shape), invoke `wp-abilities-audit` first. If the task is *verifying* an existing surface (annotation correctness, schema soundness), invoke `wp-abilities-verify` instead. This skill produces the code.

## Inputs required

- **Target domain** — free-form phrase from the user (e.g. "jetpack modules").
- **Host project** — where the class lives: `projects/plugins/jetpack/` (plugin context) or `projects/packages/<pkg>/` (package context).
- **Operations list** — which reads and writes to expose. Default to 1-3 abilities with narrow writes + broader reads. See grouping heuristic below.
- **Capability set** — which capability each operation gates on. Prefer domain-specific Jetpack caps over `manage_options`.

If any of these are ambiguous, stop and ask. Do not guess the capability.

## Procedure

### 1) Create an isolated worktree

Work happens in a git worktree, not on the current branch. Invoke the `jetpack-worktree` skill to create one with an isolated Docker environment. Suggested branch name: `add/ship-<name>-abilities` (e.g. `add/ship-modules-abilities`, `add/ship-boost-cache-abilities`).

If `jetpack-worktree` is unavailable, fall back to:

```bash
git worktree add -b add/ship-<name>-abilities ../jetpack-ship-<name> trunk
cd ../jetpack-ship-<name>
```

All subsequent steps run inside the worktree. Don't mix work with an existing branch.

### 2) Scope the domain

Locate the target's source under `projects/plugins/jetpack/` or `projects/packages/<name>/`. Read the host project's `composer.json` and confirm `automattic/jetpack-wp-abilities` is listed under `require`. If not, add it now (e.g. `"automattic/jetpack-wp-abilities": "@dev"` for monorepo-linked packages) — the composer update step runs after the class is in place.

### 3) Decide the ability set — consolidate aggressively, wrap intent

Read `references/consolidation-heuristic.md`, `references/agent-ergonomics.md`, and `wp-abilities-api/references/grouping-heuristic.md` first. Two load-bearing principles from Anthropic's tool-writing guidance:

- **Wrap the agent's intent, not the REST controller.** If the agent's real task requires chaining `get-X` → `list-Y` → `do-Z`, build a single `do-Z-for-X` ability that does all three under the hood. Atomic REST-bindings are an anti-pattern: *"tools that merely wrap existing software functionality or API endpoints — whether or not the tools are appropriate for agents."*
- **Fewer abilities beats more.** Agents benefit when each ability is a powerful filter/state-setter rather than an atomic CRUD operation.

Default rules (see the consolidation heuristic for worked examples):

- **Collapse `list-X` + `get-X` into one filtered read** (`get-Xs`). Make slug/id an optional filter that returns a 0- or 1-element array. Put all other useful filters (active, status, feature, search, date ranges) into the same input schema.
- **Replace verb pairs with declarative state-setters.** `set-module-status({slug, active})` beats `activate-module` + `deactivate-module`. The state param is required; the callback compares desired-vs-current and is idempotent by construction.
- **Every read returns the same object shape** regardless of which filter is present. Don't switch between "summary" and "detail" shapes based on input — that's a trap. Use an `expand`/`include` param if different depths are genuinely needed.
- **Group reads around the question a user would type**, not around REST atomization ("list responses with filters", not "list by status + list by date + list by author").
- **Zero-arg overview abilities** (counts, status summaries) are high-leverage and cheap — keep them if they answer a question the filtered read can't.

Before finalizing `get_abilities()`, walk the checklist at the end of `references/consolidation-heuristic.md`. If any check fails without a listed exception, merge further.

Do NOT consolidate across these hard boundaries:

- Reads and writes (different `permission_callback`, different `meta.annotations.readonly`).
- Destructive and non-destructive writes (different `meta.annotations.destructive`).
- Unrelated state surfaces on the same resource (e.g. `set-module-status` vs. `set-module-config` — same resource, different state).

### 4) Pick the category, the host, and the file path — colocate with the feature

**Read `references/module-colocation.md` first** — it walks the three-case decision and lists the exact path for each. The short version:

- **Case A — module-backed ability** (Monitor, Stats, Subscriptions, Likes, VaultPress, Search, ...): file goes **inside the module**, not in the global `src/abilities/` tree. Path: `projects/plugins/jetpack/modules/<slug>/abilities/class-<slug>-abilities.php`. The module file is only loaded when the module is active, so the ability registrar only runs when the module is active — **no `is_module_active()` guard needed, and none is wanted**.
- **Case B — package-backed feature** (Forms, Boost, Search, ...): file goes inside the package. Path: `projects/packages/<pkg>/src/abilities/class-<name>-abilities.php`.
- **Case C — plugin-core / always-on ability** (e.g. `Modules_Abilities`, connection-state readers): file goes in the plugin's global tree. Path: `projects/plugins/jetpack/src/abilities/class-<name>-abilities.php`. Use this case **only** when the ability genuinely doesn't belong to any module or package.

Then the rest of the naming:

- **Category slug — prefer a core / shared category over a plugin-scoped one when the abilities are general site management.** Think of categories as broad surface labels for the agent, not as plugin namespaces. If the abilities act on the *site* (backup/restore, modules, connection state, content), use the upstream-registered `site` category. Reach for a plugin-scoped slug only when the abilities are genuinely product-specific and don't fit any shared bucket.
  - **Use a shared/core category** (`site`, etc.) for: backup/restore, module toggles, connection-state readers, content-management actions, anything an agent would discover under "manage this site".
  - **Use a plugin-scoped slug** (`jetpack-forms`, `jetpack-boost`) when the abilities cover a product-specific surface that wouldn't sit naturally next to another plugin's tools.
  - Bad either way: bare single words you invent (`monitor`, `cache`) — pick a real shared category or namespace it.
  - **If the category you pick is registered upstream**, override `register_category()` to a no-op and skip `wp_register_ability_category()`. The base `Registrar` still hooks the categories-init callback; making it a no-op avoids "already registered" notices. `get_category_definition()` stays on the class to satisfy the abstract contract but isn't called.
- **Ability slugs:** `<product-or-feature>/<verb>-<object>`, e.g. `jetpack-monitor/get-monitor-status`, `jetpack-backup/get-backup-overview`. The slug prefix is a product/feature namespace and is independent of the category — abilities under the shared `site` category still use `jetpack-<feature>/...` slugs.
- **Class name:** `<Name>_Abilities` (e.g. `Monitor_Abilities`, `Forms_Abilities`, `Modules_Abilities`).
- **Namespace:** plugin context (Case A, Case C) → `Automattic\Jetpack\Plugin\Abilities`. Package context (Case B) → `Automattic\Jetpack\<Pkg>\Abilities`.

If you're unsure which case applies: does the ability call code that only exists when a module is active (e.g. `Jetpack_Monitor::something()`)? Case A. Does the ability live in or only make sense for a specific package? Case B. Neither? Case C — and double-check you're not actually Case A.

### 5) Write the class extending `Registrar`

Follow `references/class-skeleton.md`. Three abstract methods must be implemented:

- `get_category_slug(): string` — returns the kebab-case slug from step 4.
- `get_category_definition(): array` — returns `[ 'label' => ..., 'description' => ... ]`.
- `get_abilities(): array` — returns a `[ slug => spec ]` map.

Do NOT write an `init()` method. `Registrar::init()` handles the hook lifecycle, the `jetpack_wp_abilities_enabled` gate, and `did_action()` late-load. Just call `<Name>_Abilities::init()` from the bootstrap.

### 6) Write each ability spec

Read `references/agent-ergonomics.md` first — it distills Anthropic's "Writing tools for agents" guidance into rules for the Abilities API surface (descriptions as specs, semantic identifiers, high-signal responses, the `response_format` pattern, token ceilings on lists, errors that steer the next call). The checklist at the end of that reference is the gate before you move on.

For every entry in `get_abilities()`:

- `label` + `description` — both translatable via `__()`. Descriptions are what the agent reads at decision time; include **return shape, idempotency language, required preconditions, related abilities**. "Activate a module" is a label, not a description.
- `input_schema` — JSON Schema, `type: object`, `additionalProperties: false`, explicit `properties`. Cross-link `wp-abilities-api/references/input-schema-gotchas.md` for three runtime traps:
  1. Schema defaults are NOT auto-injected into `$input`; normalize defaults at the top of the execute callback.
  2. Pagination key drift (`per_page` vs `pagesize`); translate before delegating.
  3. `empty()`-based ID validation misclassifies the string `'0'`; use `isset()` + type check + `'' === $value`.
- `output_schema` — mirror the returned shape. Optional but recommended for the `/wp-abilities/v1/run` surface.
- `execute_callback` — `[ __CLASS__, 'method_name' ]`. Method signature is `( $input = null )`. Return value is a plain array (or `WP_Error`). Keep the shape **high-signal** — don't return raw `$mod` / `WP_Post` / option dumps; summarize. See the anti-patterns section of `references/agent-ergonomics.md`.
- `permission_callback` — `[ __CLASS__, 'can_method' ]`. See the permissions table below.
- `meta.annotations` — `readonly`, `destructive`, `idempotent` booleans. These must match execute behavior; `wp-abilities-verify` will flag mismatches.
- `meta.mcp` — every ability gets `'mcp' => array( 'public' => true, 'type' => 'tool' )`. This is what surfaces the ability to MCP-bridged AI agents as a tool. Matches the convention used by Stats / Boost / Modules abilities; leaving it off makes the ability invisible to MCP consumers even though it shows up in `/wp-abilities/v1/abilities/`. Flip `public => false` only when the ability is for internal callers and explicitly shouldn't be agent-discoverable.
- `meta.show_in_rest` — `true` when the ability should be callable via REST.
- **Do NOT set `category`** in the spec. `Registrar` auto-injects it. Setting it duplicates info that drifts.
- `WP_Error` codes — use the shared vocabulary in `wp-abilities-api/references/error-code-vocabulary.md` (`<plugin>_not_initialized`, `<plugin>_missing_<field>`, `<plugin>_invalid_<field>`, `<plugin>_<resource>_data_unavailable`). The **message** should tell the agent *what to do next* — e.g. "Unknown module slug. Call jetpack-modules/get-modules to enumerate." — not just restate the error condition.
- **Pagination** — any list-shaped read needs `page`/`per_page` (or `limit`/`cursor`) with a `default` of ~20 and a `maximum` of ~100. Enforce the max in the callback. Even if today's dataset is small, don't ship ability specs that return unbounded lists.

### 7) Pick permissions

Inline decision table:

| Shape | Capability pattern | Example |
|---|---|---|
| Public read | `return true;` | rare; site-wide catalog |
| Authenticated read | `is_user_logged_in()` | "my drafts" |
| Admin view | `current_user_can( 'jetpack_admin_page' )` | list modules |
| Admin write | `current_user_can( 'jetpack_manage_modules' ) && current_user_can( 'jetpack_activate_modules' )` | toggle module |
| Per-object write | `current_user_can( 'edit_post', $id )` | update a specific response |
| Core fallback | `current_user_can( 'manage_options' )` | only when no Jetpack-specific cap fits |

Rules:

- Prefer narrow Jetpack-specific caps over `manage_options`.
- Differentiate read (`can_view_*`) from write (`can_manage_*`). Never reuse a view check to gate a write.
- `permission_callback` returns `bool` or `WP_Error`. Never throws.
- Callbacks receive no arguments; they inspect global user state.

### 8) Wire into the host — choose based on the case from step 4

**Where `::init()` is called determines when the ability registers.** Pick the wiring point that matches the case from step 4. A single line; the class is autoloaded, so no `require_once` is needed.

**Case A — module-backed:** wire from **inside the module file** so registration is gated by module activation automatically.

```php
// projects/plugins/jetpack/modules/<slug>.php, at the bottom of the file:
\Automattic\Jetpack\Plugin\Abilities\<Slug>_Abilities::init();
```

Jetpack's `load_modules()` only includes `modules/<slug>.php` when the module is active, so the call only happens when the module is on. Do **not** wire from `class.jetpack.php` — that loads the ability regardless of module state, which is the anti-pattern `references/module-colocation.md` exists to prevent.

**Case B — package-backed:** wire from the package's **existing bootstrap** (e.g. `Contact_Form_Plugin::init()` for Forms, `Jetpack_Boost::init()` for Boost). Never from the consumer plugin's `class.jetpack.php`.

**Case C — plugin-core / always-on:** wire from `class.jetpack.php` in the plugin's constructor or `plugins_loaded` handler. Use this **only** when the ability isn't tied to a module or package.

```php
// Case C only — projects/plugins/jetpack/class.jetpack.php:
\Automattic\Jetpack\Plugin\Abilities\<Name>_Abilities::init();
```

The Jetpack plugin's `composer.json` declares `"autoload": { "classmap": ["src"] }` and modules are classmap-discovered too, so the class loads from whichever of the three locations you chose once `composer dump-autoload` runs (step 9). If you see the legacy `require_once JETPACK__PLUGIN_DIR . 'src/abilities/class-<x>-abilities.php';` pattern in `class.jetpack.php`, treat it as redundant: the class is already in the classmap, and adding `require_once` is the wrong fix for a stale-autoloader problem.

Placement timing matters: `::init()` must run before `wp_abilities_api_init` fires — for Case A that's automatic (modules load early), for Case B the package's bootstrap is already early enough, for Case C put it in the constructor or `plugins_loaded`.

### 9) Link the monorepo dependency and refresh the autoloader

Because `automattic/jetpack-wp-abilities` is a monorepo package and the subclass references its `Registrar` base, the host project's autoloader must pick up the dependency before tests or any runtime code can find the class.

Run these from inside the worktree:

```bash
cd projects/plugins/jetpack         # or projects/packages/<pkg>/
composer update automattic/jetpack-wp-abilities    # first time the dep is added
# OR, if composer.json already required it before this change:
composer install
composer dump-autoload               # cheap, catches stale autoload after adding new classes
```

Expected result: `composer.lock` in the host project updates (symlink / path repo target now points at the monorepo copy), and `vendor/composer/autoload_classmap.php` (or `autoload_psr4.php`) sees both the new `<Name>_Abilities` class and the `Automattic\Jetpack\WP_Abilities\Registrar` base.

**`composer dump-autoload` is what makes the new class findable** — it's not optional. The Jetpack plugin uses classmap autoload, so until the classmap is regenerated, the bootstrap call to `<Name>_Abilities::init()` will fatal with "class not found" even though the file is on disk.

If `composer update automattic/jetpack-wp-abilities` reports "Nothing to modify in lock," the dep was already linked — just run `composer dump-autoload`.

### 10) Write tests

Follow `references/test-templates.md`. **In particular, do NOT add
`setExpectedIncorrectUsage('WP_Ability_Categories_Registry::register')` or
`setExpectedIncorrectUsage('WP_Abilities_Registry::register')` to test
helpers that re-fire the Abilities API lifecycle actions — that's a
mandatory assertion, and the underlying core listeners don't always emit
the expected notice in CI, which fails every test that uses the helper.
See the "Anti-pattern" entry in `references/test-templates.md` for the full
story. Mirror the Monitor test pattern (just `do_action()` twice, no
incorrect-usage expectations).**

The test file lives at:

- Plugin context: `projects/plugins/jetpack/tests/php/src/<Name>_Abilities_Test.php` (extends `WP_UnitTestCase`, uses `WP_UnitTestCase_Fix` trait + `#[CoversClass]` attribute).
- Package context: `projects/packages/<pkg>/tests/php/abilities/<Name>AbilitiesTest.php` (extends `PHPUnit\Framework\TestCase`, uses Brain Monkey + Mockery).

Required coverage:

- **Registrar wiring** (the differentiating value-add):
  - `jetpack_wp_abilities_enabled` defaulting false → `init()` registers nothing.
  - Filter enabled, neither action fired → both lifecycle hooks added.
  - Filter enabled, `wp_abilities_api_categories_init` already fired → category registered directly, abilities still hooked.
  - Per-ability `jetpack_wp_abilities_should_register` filter — returning false skips that ability.
  - Category auto-injection — abilities whose spec omits `category` get the subclass's slug.
- **Abstract getters** — `get_category_slug`, `get_category_definition`, `get_abilities` return the expected shapes.
- **Permission callbacks** — allowed user returns true; denied user returns false; unauthenticated returns false.
- **Execute callbacks** — happy path for each ability returns the documented shape.
- **Consolidated-read contract** — `get-<objects>` with unknown id returns an empty array (not `WP_Error`); shape is the same whether or not `id` is provided.
- **Declarative-write idempotency** — `set-<object>-<attribute>` with desired==current returns `changed=false`; with desired!=current returns `changed=true` after transition.
- **Schema edge cases** — missing required field returns `WP_Error`; empty-string ID rejected; wrong type rejected; the literal string `'0'` accepted (regression guard against `empty()`).

### 11) Add the changelog entry — use the tool, then validate

**Do not hand-write the file.** Each project has its own allowed `Type:` values (the Jetpack plugin uses `enhancement`; packages use `added`; others differ), and hand-crafted entries silently ship the wrong type. Use the changelogger CLI — it reads the project config and rejects invalid types at the source:

```bash
cd projects/plugins/jetpack                      # or projects/packages/<pkg>/
vendor/bin/changelogger add \
  --no-interaction \
  --significance=minor \
  --type=enhancement \                           # plugin: enhancement; package: added
  --entry="Abilities API: register abilities for <domain> on WP 6.9+." \
  --filename=add-<name>-abilities
```

(If you prefer the Docker workflow, `jp changelog add` is equivalent.)

Then run the linter — **this is a mandatory gate before step 12, same check CI runs:**

```bash
vendor/bin/changelogger validate
```

Must exit 0 with no output. If it fails, fix and re-run; never suppress with `--no-strict`. Do not hand-edit the generated file — the tool wrote it correctly; manual edits reintroduce encoding / header / type mistakes.

### 12) Run the tests

- Plugin: `cd projects/plugins/jetpack && composer phpunit -- --filter <Name>_Abilities_Test`
- Package: `cd projects/packages/<pkg> && composer phpunit -- --filter <Name>AbilitiesTest`

Every assertion group in `references/test-templates.md` (Registrar wiring, abstract getters, permissions, execute, schema edge cases) must pass before proceeding. If the autoloader can't find the new class, re-run `composer dump-autoload` inside the host project.

### 13) Run `/simplify` and apply findings

Before committing, invoke the `simplify` skill on the changes. It reviews the new code for reuse opportunities (e.g. an existing helper that does what `delegate_to_rest_controller` already does), overengineering (abstractions with one caller, premature factories), and inefficiency.

- Accept findings that genuinely reduce code without losing test coverage.
- Reject findings that would break the Registrar-wiring assertions (e.g. "inline `get_abilities()` since it's only called once" — no, the abstract method contract matters).
- Re-run `composer phpunit -- --filter <Name>_Abilities_Test` (step 12) after each fix. All assertion groups must stay green.

### 14) Commit — include the updated `composer.lock`

This PR adds a dependency to `composer.json`, so `composer.lock` must be committed alongside it. CI runs with `--frozen-lockfile`; a missing or stale lockfile fails the build.

Stage and commit:

```bash
git add \
  projects/<plugin-or-package>/composer.json \
  projects/<plugin-or-package>/composer.lock \
  projects/<plugin-or-package>/src/abilities/class-<name>-abilities.php \
  projects/<plugin-or-package>/tests/.../<Name>_Abilities_Test.php \
  projects/<plugin-or-package>/changelog/add-<name>-abilities \
  <bootstrap file with the one-line ::init() call>
git commit -m "<Name> abilities: register <domain> via Registrar"
```

Do NOT stage unrelated lock drift in other packages — only the host project's `composer.lock` should move.

### 15) Push, open a draft PR, and run `/jetpack-review-pr`

Push the branch and open a draft PR (use the `jetpack-pr` skill for templating). Once the PR exists, invoke the `jetpack-review-pr` skill with the PR number — it covers bugs, security, performance, WP/Jetpack conventions, and test-coverage gaps that `/simplify` wouldn't catch.

Treat the review as a loop, not a one-shot:

1. Run `/jetpack-review-pr <pr-number>`.
2. For each finding, decide: **fix** (actionable bug/convention), **defer** (tracked separately, explain why in a PR comment), or **reject** (valid disagreement, explain).
3. Apply fixes in follow-up commits on the same branch.
4. Re-run `composer phpunit -- --filter <Name>_Abilities_Test` after each fix.
5. Re-run `/jetpack-review-pr` once findings are addressed to confirm no regressions were introduced.

Common issues this review tends to catch for Abilities PRs:

- Missing nonce or capability check beyond `permission_callback` (e.g. write paths that touch options without additional guarding).
- Schema that accepts unsanitized strings passed into `wpdb` or `update_option` keys.
- Error code strings that don't follow the `<plugin>_*` vocabulary (cross-link to `wp-abilities-api/references/error-code-vocabulary.md`).
- Missing i18n text domain on `__()` strings.
- Annotations that don't match behavior — hand off to `wp-abilities-verify` and fix the annotations or the execute, not the test assertion.

Mark the PR ready-for-review only after the review loop converges (no open blocking findings) and tests still pass.

## Verification

- Work landed in an isolated worktree (not `trunk` or a pre-existing branch).
- `references/agent-ergonomics.md` end-of-file checklist walked for each ability — descriptions include return shape + preconditions + related abilities; outputs are high-signal; identifiers human-readable; lists paginated; errors steer the next call.
- `references/consolidation-heuristic.md` end-of-file checklist walked — no unnecessary list+get splits; no verb pairs; uniform return shape per ability.
- The target project's `composer phpunit -- --filter <Name>_Abilities_Test` passes — every assertion group in `references/test-templates.md` green.
- `composer.lock` in the host project is staged and committed; no lock drift in unrelated packages.
- `/simplify` was run and its findings were applied, deferred, or rejected with reasoning.
- `/jetpack-review-pr` was run against the open PR and converged — no open blocking findings.
- `wp-abilities-verify` in static mode against the host project passes: new abilities recognized, annotations match behavior, schemas valid.
- In a running WP environment with the `jetpack_wp_abilities_enabled` filter returning true, `wp_get_abilities()` lists the new slugs and `/wp-json/wp-abilities/v1/abilities` exposes them.
- Changelog entry exists at the expected path and has the three required lines (significance, type, blank line, message).
- `vendor/bin/changelogger validate` (run from the host project) exits 0 — same linter CI uses. No warnings accepted without explicit reasoning.
- **Colocation lint** from `references/module-colocation.md` produces no `COLOCATION FAIL` output. Module-backed abilities live inside their modules; `class.jetpack.php` does not wire any module-backed `<Slug>_Abilities::init()`.
- **Activation-gating test** passes: the test asserting that the ability does not register when its backing module is inactive (Case A only) is green. See `references/test-templates.md`.

## Failure modes / debugging

- **Nothing registers at runtime.** `jetpack_wp_abilities_enabled` defaults to `false`. Tests must filter it true (`Filters\expectApplied('jetpack_wp_abilities_enabled')->andReturn(true)`), and live sites need to opt in via a feature flag, option, or site-specific filter.
- **The class loads but hooks don't fire.** You're loading the file too late — after `wp_abilities_api_init` has already fired — and you also skipped `Registrar::init()`'s late-load path by overriding `init()`. Don't override `init()`; let the base class run.
- **You see the legacy manual-hook pattern elsewhere** (e.g. `projects/plugins/jetpack/src/abilities/class-modules-abilities.php`, `projects/packages/forms/src/abilities/class-forms-abilities.php`). These predate the `Registrar` package. Don't copy them. Extend `Registrar` and implement the three abstract methods.
- **Module-backed ability landed in `projects/plugins/jetpack/src/abilities/` and is wired from `class.jetpack.php`** (the PR #48284 pattern). Colocation lint will catch this. The ability loads on every request regardless of module state, pollutes the API surface when the module is off, and pays autoload cost for nothing. Move the file into `modules/<slug>/abilities/` and wire from `modules/<slug>.php`.
- **Adding `if ( Jetpack::is_module_active( '<slug>' ) )` around the `::init()` call in `class.jetpack.php`.** Better than not guarding, but still wrong — you're re-implementing what `load_modules()` does for free. Move the wiring into the module file instead.
- **Duplicate `category` in a spec.** Silent smell — `Registrar` injects the slug when missing. Setting `'category' => self::CATEGORY_SLUG` in each spec is redundant and drifts.
- **Annotation mismatch** (`readonly: true` on a writer, `destructive: false` on a deleter). `wp-abilities-verify` is the source of truth; this skill doesn't re-check annotation correctness.
- **CI fails with "Failed to assert that `WP_Ability_Categories_Registry::register` triggered an incorrect usage notice."** A previous version of the test added `setExpectedIncorrectUsage()` calls as a "whitelist" inside a `trigger_registration()` helper. `setExpectedIncorrectUsage` is a *mandatory* assertion — the test fails when the notice doesn't fire, which it usually doesn't in CI because core's site-category / `get-site-info` listeners aren't loaded. Fix: delete the `setExpectedIncorrectUsage` lines from the helper. See `references/test-templates.md` "Anti-pattern" note and PR #48335 commit `af3cdfb51a`.
- **Description is a label, not a spec.** `"Activate a module."` tells the agent nothing. Rewrite to include return shape, idempotency, preconditions, and which abilities typically precede or follow. See `references/agent-ergonomics.md`.
- **Raw backing-object dump in the response.** Returning `Jetpack::get_module()` verbatim, a full `WP_Post`, or a REST controller payload unadapted leaks internal fields the agent can't use and wastes context. Summarize to the shape the agent actually consumes.
- **Unbounded list response.** A `list-*` / `get-*s` read with no `per_page` or `limit` ceiling is a latent OOM on the agent side. Cap at ~100 items, paginate past that.
- **Composer autoload out of date** after adding a new class → `composer dump-autoload` inside the host project. If the `Registrar` base class itself isn't found, step 9 was skipped; run `composer update automattic/jetpack-wp-abilities` (or `composer install`).
- **Reaching for `require_once` to "fix" class-not-found.** Don't. The Jetpack plugin uses classmap autoload on `src/`; packages use PSR-4. Both are regenerated by `composer dump-autoload`. Adding a manual `require_once` patches the symptom but leaves the autoloader broken — future tests, REST dispatch, and CLI commands will all fail the same way until the autoloader is rebuilt.
- **CI fails with "lockfile out of date"** → step 14 was skipped. Commit the updated `composer.lock` for the host project.
- **CI fails with "Invalid type" on the changelog entry.** Step 11 was bypassed by hand-writing the file instead of using `vendor/bin/changelogger add`. Delete the entry, re-run the `changelogger add` command, then `changelogger validate` — the tool knows which types the host project accepts.
- **`/simplify` suggests deleting the `get_abilities()` method or inlining `Registrar::init()`.** Reject. These are abstract-contract methods; removing them breaks the subclassing relationship and every Registrar-wiring test.
- **`/jetpack-review-pr` flags "inconsistent error codes."** Cross-link `wp-abilities-api/references/error-code-vocabulary.md` and update the codes to match the `<plugin>_*` vocabulary. Don't argue — the vocabulary is cross-plugin contract.
- **`did_action()` returning 0 in unit tests** where you expected the action to be fired. Package tests with Brain Monkey need `Functions\when('did_action')->justReturn(0)` (or an alias that returns the action you care about). Plugin tests using `WorDBless\BaseTestCase` need to simulate the action manually — see the `simulate_doing_wp_abilities_*_action()` helpers in `projects/packages/forms/tests/php/abilities/Forms_Abilities_Test.php`.

## Escalation

- When the ability surface needs a new WordPress capability or a new backend endpoint, stop and open a discussion — don't invent caps or endpoints as part of shipping abilities.
- When the grouping is ambiguous (is this one ability with filters or three separate ones?), invoke `wp-abilities-audit` to produce an audit document first, then come back here.
- When the abilities wrap an existing REST controller through a shared API client, read `wp-abilities-api/references/delegate-helper-pattern.md` and `wp-abilities-api/references/plugin-family-patterns.md` to pick Pattern A (shared-API-client) vs Pattern B (zero-arg controllers).
- For canonical details on the base class and its lifecycle, read `projects/packages/wp-abilities/src/class-registrar.php` and `projects/packages/wp-abilities/tests/php/RegistrarTest.php`.
