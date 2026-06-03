# Module colocation — where the ability code lives

Abilities must live **with the feature they expose**. An ability for the Monitor module loads only when Monitor is active; an ability for the Forms package loads with the Forms package; an always-on ability (one that manages modules themselves) lives in the plugin's core `src/`. Putting a module-backed ability in the plugin's global `src/abilities/` tree and wiring it unconditionally in `class.jetpack.php` — as PR [#48284](https://github.com/Automattic/jetpack/pull/48284) did for Monitor — loads that code even when the module is deactivated, pollutes the Abilities API surface with operations the user can't perform, and is the canonical anti-pattern this reference exists to prevent.

## The three cases

Walk this decision tree **before** step 4 of the skill.

### Case A — Module-backed ability (most common)

The ability wraps a Jetpack module (`monitor`, `stats`, `subscriptions`, `likes`, `vaultpress`, `search`, `related-posts`, ...). The module is a flat file at `projects/plugins/jetpack/modules/<slug>.php` (possibly with a companion directory `modules/<slug>/`). Jetpack's `load_modules()` only includes the module file when the module is active.

**File location:** inside the module's directory.

- Small ability (one class): `projects/plugins/jetpack/modules/<slug>/abilities/class-<slug>-abilities.php` (create the directory if the module doesn't have one yet).
- Tiny ability (dozen lines): inline at the bottom of `modules/<slug>.php` is acceptable.

**Wiring:** from inside the module file (or the module's main class constructor / `init()`). Never from `class.jetpack.php`.

```php
// projects/plugins/jetpack/modules/<slug>.php, at the bottom:

require_once __DIR__ . '/<slug>/abilities/class-<slug>-abilities.php';
\Automattic\Jetpack\Plugin\Abilities\<Slug>_Abilities::init();
```

Because the module file is only included when the module is active, the ability registrar only runs when the module is active. No `Jetpack::is_module_active()` guard is needed.

**Test:** add the activation-gating assertion from `test-templates.md` — the ability class must not even be loadable outside the module's load path.

### Case B — Package-backed feature

The feature lives in its own Composer package under `projects/packages/<pkg>/` (Forms, Boost, Search, Stats-CLI, etc.). The package has its own bootstrap class; it's loaded via Composer autoload when the consumer plugin requires it.

**File location:** `projects/packages/<pkg>/src/abilities/class-<name>-abilities.php`.

**Wiring:** from the package's own bootstrap — whatever method is already the entry point for that package's runtime (e.g. `Contact_Form_Plugin::init()` for Forms, `Jetpack_Boost::init()` for Boost). Never from the consumer plugin's `class.jetpack.php`.

Package-level features typically already gate themselves on "is this package meant to run right now?" via the consumer plugin's load sequence, so additional module-active guards are usually unnecessary. If the package ships as both a module and a standalone plugin, the package's own bootstrap is the right place for any gating.

### Case C — Plugin-core / always-on ability

The ability is about the plugin itself, not any specific module: enumerating modules, reading connection status, fetching plugin version. `Modules_Abilities` is the canonical example — it manages the module system, so it can't live inside any one module.

**File location:** `projects/plugins/jetpack/src/abilities/class-<name>-abilities.php`.

**Wiring:** one line in `class.jetpack.php`, loaded unconditionally (subject to the `jetpack_wp_abilities_enabled` feature gate `Registrar::init()` already applies).

Use this case **only** when the ability genuinely doesn't belong to any module or package. When in doubt, it's Case A.

## Anti-patterns

1. **Module ability in `src/abilities/` with unconditional wiring in `class.jetpack.php`.** Loads and registers the ability even when the module is inactive. PR #48284's Monitor placement is the live example.
2. **Module ability in `src/abilities/` with an `is_module_active()` guard.** Better than (1) but still wrong — the file is still loaded on every request, every request pays the autoload cost, and the test harness has to mock the module-activation check. Colocate inside the module instead; the module's own load gate does the work for free.
3. **Package ability in `projects/plugins/jetpack/src/abilities/`.** Couples the plugin to package internals; breaks when the package is used by a non-plugin consumer (standalone package, different host plugin).
4. **Multiple modules' abilities in one shared file.** Each module's abilities stay with that module. A shared file couples their load timing and breaks colocation.

## What the skill enforces

- **Step 4** (Pick the category and file path) forces the decision above — module vs package vs plugin-core — before a file path is chosen.
- **Step 8** (Wire into the host) wires based on case:
  - Case A → line inside `modules/<slug>.php` (or the module's main class init).
  - Case B → line inside the package's existing bootstrap method.
  - Case C → line inside `class.jetpack.php`.
- **Tests** (`references/test-templates.md`) include an activation-gating assertion for Case A: when the module file has not been loaded, `Registrar::init()` must register nothing. The test proves the ability can't leak into the REST surface when the module is off.
- **Verification** runs a grep-based colocation lint (see next section) to catch any regression that puts module-backed code into `src/abilities/`.

## Colocation lint

Run from the host project root after wiring and tests:

```bash
# 1. No module-backed ability should live in src/abilities/ unless it's Case C.
#    Flag anything in src/abilities/ whose class name is <Module>_Abilities
#    where <module> also exists as a Jetpack module file.
find projects/plugins/jetpack/src/abilities -maxdepth 1 -type f -name 'class-*-abilities.php' 2>/dev/null |
  while read -r f; do
    base=$(basename "$f" | sed 's/^class-\(.*\)-abilities\.php$/\1/')
    if [ -f "projects/plugins/jetpack/modules/${base}.php" ]; then
      echo "COLOCATION FAIL: $f is a module-backed ability; move to modules/${base}/abilities/ and wire from modules/${base}.php"
    fi
  done

# 2. class.jetpack.php must not init any module-backed <Module>_Abilities class.
#    Any <Slug>_Abilities::init() call in class.jetpack.php whose slug also names
#    a module is a colocation violation. Class names are snake_case on word
#    boundaries (Related_Posts_Abilities, Monitor_Abilities), so slug =
#    lowercase with underscores→dashes.
grep -oE '[A-Z][A-Za-z_]+_Abilities::init\(\)' projects/plugins/jetpack/class.jetpack.php 2>/dev/null |
  while read -r call; do
    slug=$(echo "$call" | sed 's/_Abilities::init()//' | tr '[:upper:]_' '[:lower:]-')
    if [ -f "projects/plugins/jetpack/modules/${slug}.php" ]; then
      echo "COLOCATION FAIL: ${slug} is a module; its abilities should init from modules/${slug}.php, not class.jetpack.php"
    fi
  done
```

Both blocks must produce no output. If either prints a `COLOCATION FAIL` line, fix before committing — move the file, re-wire from the module, and re-run tests. Handles both bash and zsh; no-match cases are silent.

This lint is additive to `wp-abilities-verify` (which checks annotation correctness and schema soundness, not colocation). Run both.
