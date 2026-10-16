---
name: jetpack-feature-flag
description: "Use when adding, gating, testing, or retiring a Jetpack feature flag built on the `automattic/jetpack-feature-flags` package — Feature_Flags::register(), branching on is_enabled(), declaring and installing the dependency, regenerating dependent plugin lock files, bridging the flag to JS, and forcing it on for testing via the `jetpack_feature_flag_enabled_<flag>` filter or `wp companion feature-flag` on Jurassic Ninja. Triggers on 'add a feature flag', 'put this behind a flag', 'gate this feature', 'ship this disabled by default', 'kill switch', 'staged rollout', 'remove the feature flag'. NOT for other things loosely called flags: ExPlat experiments, paid-plan gating via Current_Plan::supports(), module activation, JETPACK_* constants, Jetpack_Options, or adding a key to the `jetpack_block_editor_feature_flags` filter. Use only when the toggle is, or should become, a registered Feature_Flags flag."
compatibility: "Jetpack monorepo. Requires the `automattic/jetpack-feature-flags` package (`projects/packages/feature-flags`, PHP 7.4+). The `wp companion feature-flag` command used for testing is preinstalled on every Jurassic Ninja site; it does not exist in `jp docker`."
---

# Jetpack Feature Flags

Register a flag, branch on it, ship it off by default, turn it on to test, delete it when the feature lands.

## Is a flag the right tool?

A flag is for **temporary** branching you can change without changing code: gating unreleased work, staged rollout, or a kill switch for something risky.

Reach for something else when the toggle is **permanent** — that is site configuration, a user-facing setting, or a constant. A flag that would live forever is really config wearing a flag's clothes.

## Package or plugin?

Three steps below fork on this. Decide once, up front.

| | Flag in `projects/packages/…` | Flag in `projects/plugins/…` |
|---|---|---|
| Register (step 2) | On the hook the consuming feature loads | On `init`, or `plugins_loaded`, from the plugin's main class |
| Lock files (step 5) | Every plugin that bundles the package | That plugin's own lock, and only it |
| Changelog (step 6) | Package entry, plus one per shipping plugin if user-facing | One entry, in that plugin |

## 1. Add and install the dependency — before writing any code

Every step below fails without this. The `use` statement in step 2 fatals under `jp phan`, a direct `phpunit` run, and your IDE.

```json
"require": {
    "automattic/jetpack-feature-flags": "@dev"
}
```

```bash
jp install <type>/<project>
```

Editing `composer.json` does **not** put the class in the project's own `vendor/` — install it. (`jp test php` happens to run its own install, so that one command self-heals; nothing else does.)

Declare every package you `use`, not just this one. A class that resolves transitively today breaks silently when the intermediate package drops its own dependency.

## 2. Register the flag

### Choosing the hook

Register on the **earliest hook that fires in every context that reads the flag** — not the hook the gated feature happens to load on.

**Admin-only hooks are almost always wrong**, even for an admin-only feature. `admin_menu`, `_admin_menu`, `admin_init`, and `load-*` never fire under WP-CLI, REST, or cron. Register there and `wp companion feature-flag list` reports the flag missing, and every non-admin `is_enabled()` call silently returns the unregistered default of `false`.

**When the loader is nested**, register at the outermost entry point that is gated by *whether the feature ships at all*, above every "this site isn't eligible" early return. The flag should stay visible while you are diagnosing why the feature is off.

Registering earlier than the feature loads is never a bug. Registering later than any reader always is.

Safe choices: `plugins_loaded`, `init`, or file scope in an already-loaded bootstrap.

### In a package

`projects/packages/forms/src/class-jetpack-forms.php`:

```php
use Automattic\Jetpack\Feature_Flags\Feature_Flags;

const CONDITIONAL_LOGIC_FLAG = 'forms-conditional-logic';

public static function register_feature_flags() {
	Feature_Flags::register(
		self::CONDITIONAL_LOGIC_FLAG,
		array(
			'default'     => false,
			'description' => 'Show or hide a form field based on the answer to another field.',
			'owner'       => 'jetpack-forms',
		)
	);
}
```

Called first thing from `Jetpack_Forms::load_contact_form()`, which `projects/plugins/jetpack/modules/contact-form.php` calls at file scope — and Jetpack requires active module files on `after_setup_theme` priority `-2`, so it beats every reader.

### In a plugin

There is no module loader to inherit, and the plugin's own bootstrap is not a "separate always-on bootstrap" to avoid — the plugin *is* the unit of activation. Call the registrar first thing from the main class:

```php
public function __construct() {
	add_action( 'init', array( $this, 'init' ) );
}

public function init() {
	self::register_feature_flags();   // Before REST, admin menus, or CLI can read it.
	// …
}
```

Use `plugins_loaded` instead if anything reads the flag before `init`. Do not register inside the method that builds the admin menu, even when the admin menu is all the flag gates.

### Naming

Names must match `/^[a-z0-9][a-z0-9_-]*$/`, prefixed with the owning product area (`forms-conditional-logic`, not `conditional-logic`).

**Nothing will check this for you.** `register()` never validates at runtime, and the `Jetpack.FeatureFlags.FeatureFlagName` PHPCS sniff only inspects a **plain string literal** in the first argument — the class constant recommended below is skipped entirely, as is the Forms example above. Verify by eye, or inline the literal once, run PHPCS, then move it into the constant.

A bad name is not a lint error later. It registers and reads fine, but the Companion CLI hard-errors rather than storing an override for it and the a8c screen lists it with no control, so the feature becomes untestable on every site.

Hold the name in a class constant anyway, so registration and every check share one spelling.

### Where the flag will and won't exist

**A flag only exists where its owning code loads, and that is fine.** The Forms flag registers only when the Forms module is active. On a site where it isn't, the flag is absent from `Feature_Flags::all()`, from the a8c screen, and from `wp companion feature-flag list` — correct behaviour, not a bug to work around by hoisting registration somewhere more global.

Distinguish that from the failure above: absent because the **owning feature** is inactive is expected; absent because you registered on a hook that **this request type** never fires is a bug.

**When a reader runs before your feature loads** — an admin redirect, a REST permission callback — do not hoist `register()` to chase it. Give the early reader a separate lightweight default at its own tier: a second `Feature_Flags::register()` call on the earlier hook, same name, same default. `register()` is last-write-wins, so the repeat is harmless — but the two must agree, or whichever ran last silently decides what the flag means.

## 3. Gate the code

```php
if ( Feature_Flags::is_enabled( self::CONDITIONAL_LOGIC_FLAG ) ) {
	// The new path.
}
```

Wrap it in a named predicate (`Jetpack_Forms::is_conditional_logic_enabled()`) rather than scattering `is_enabled()` calls — one place to delete when the flag retires.

`is_enabled()` on an unregistered name returns `false` but still runs the filters, so a typo fails silently in the "off" direction. That is why the name lives in a constant.

**Do not add `class_exists()` guards** around `Feature_Flags`. Steps 1 and 5 are what make the class present; a guard converts a loud missing-dependency fatal into a silently all-flags-off site. The only guarded caller in the repo is the a8c control screen, which has to render on sites that legitimately lack the package.

## 4. Bridge it to JS, if the feature has any

Do not re-derive the flag in JS, and do not add a second transport. Find the channel the target project already uses to hand PHP state to its JS, and put the predicate's answer on it:

- **Block editor** → the `jetpack_block_editor_feature_flags` filter, which Forms hooks in `class-contact-form-block.php` and which lands as `window.Jetpack_Editor_Initial_State.feature_flags`
- **Front-end app** → the package's existing state builder, e.g. Search's `Helper::generate_initial_javascript_state()`
- **React admin app** → the plugin's existing initial-state payload, under a `featureFlags` map keyed by flag name

**Name-collision warning.** `hasFeatureFlag()` from `@automattic/jetpack-shared-extension-utils` is *not* part of `automattic/jetpack-feature-flags`. It reads `getJetpackData().feature_flags`, populated by `jetpack_block_editor_feature_flags` — a separate mechanism that also carries `Current_Plan::supports()` paid-plan gates and plain bootstrap defaults. Forms routes its `Feature_Flags` answer *through* it, which is why they look connected. Adding a key to that filter **instead of** registering a flag gives you something no control surface in this skill can toggle.

If the payload goes through `wp_localize_script` rather than `wp_json_encode`, nest the map — top-level booleans get stringified to `"1"`/`""`.

## 5. Regenerate the lock files

**If the flag lives in a package** — find the plugins that bundle it, and regenerate each one's lock:

```bash
jp dependencies list packages/<package> --add-dependents --extra build --no-dev | grep '^plugins/'
tools/composer-update-monorepo.sh --root-reqs projects/plugins/<plugin>
```

**If the flag lives in a plugin** — skip the discovery command; it returns only the plugin itself. Regenerate that plugin's own lock, which is the one that is tracked:

```bash
tools/composer-update-monorepo.sh --root-reqs projects/plugins/<plugin>
```

Run both from the repo root. `--root-reqs` is load-bearing: the script builds its update list from `composer info --locked`, which cannot list a package that is not in the lock yet, so without it a newly added requirement never lands.

Package `composer.lock` files are gitignored; **plugin** lock files are tracked, and the `lock_files` CI job fails when they drift. Confirm before pushing:

```bash
git diff --stat projects/plugins/<plugin>/composer.lock   # must be non-empty
.github/files/check-lock-files.sh                          # what the lock_files CI job runs
```

Skipping this breaks CI, and if it slips through, **fatals the built plugin** — the class is not autoloadable and the unguarded `register()` call dies on load. Only the `class_exists()`-guarded control screen degrades quietly, showing an empty list that looks exactly like "no flags registered yet".

## 6. Changelog

Add an entry to the project you touched. Every plugin whose lock file you regenerated counts as touched and needs one too.

**Types are per-project.** `plugins/jetpack` uses `major | enhancement | compat | bugfix | other` — `-t added` is rejected there. Check `.extra.changelogger.types` in the project's `composer.json`; most projects use the default `security | added | changed | deprecated | removed | fixed`. A wrong type passes the pre-push hook and fails the "Changelogger validity" CI job.

**A flag that ships off is not user-facing.** Nothing a site owner can observe has changed, so describe the flag, not the feature, and keep the significance low. Save the `-s minor` entry describing the feature for the PR that flips the default or deletes the flag.

```bash
jp changelog add packages/<project> -s patch -t added   -e "Add a feature flag for <thing>."
jp changelog add plugins/jetpack    -s patch -t other   -e "" -c "Update package dependencies."
jp changelog add plugins/<other>    -s patch -t changed -e "" -c "Update package dependencies."
```

Use `$$next-version$$` in any `@since` you write. Never substitute a real version.

## 7. Verify

```bash
jp test php <type>/<project>
jp phan <type>/<project>
composer phpcs:lint -- projects/<type>/<project>/
```

PHPCS needs a monorepo-root `composer install`; without one it aborts on a missing `jetpack-phpcs-filter` bootstrap, which is a setup failure, not a clean lint.

**If the project has no PHPUnit suite, `jp test php` exits 0 having run nothing.** That is not verification — either put the predicate somewhere testable, or state in the PR that the branches were checked manually and how.

**In tests**, force the new branch with the per-flag filter, and clean up two things, not one:

```php
add_filter( 'jetpack_feature_flag_enabled_my-flag', '__return_true' );
```

- Remove the filter in teardown — and check which name your base class uses. WorDBless `BaseTestCase` subclasses override `tear_down()`; classes extending `PHPUnit\Framework\TestCase` directly override `tearDown(): void`. The wrong one is a method PHPUnit never calls.
- Call `Feature_Flags::reset()` too. The registry is `private static`, so anything your test registered stays registered for the rest of the suite.
- In Brain Monkey suites `add_filter()` does not apply filters at all — use `Filters\expectApplied( … )` instead.

Test **both** branches. A flag registered `'default' => false` means the default test run exercises the old path only.

**None of the above catches the failures this skill exists to prevent** — a flag registered too late, or a package that is not autoloadable in the built plugin. Both pass CI and fail on a real site. Check on Docker or JN:

```bash
# bool(false) means step 1 or 5 was skipped.
wp eval 'var_dump( class_exists( "Automattic\\Jetpack\\Feature_Flags\\Feature_Flags" ) );'

# Is the flag registered on this request type? Repeat under `wp` and in the browser.
wp eval 'var_dump( array_keys( \Automattic\Jetpack\Feature_Flags\Feature_Flags::all() ) );'
```

If the second is missing your flag while the first is `true`, the registration hook did not fire for this request — re-read "Choosing the hook" before assuming it is the expected inactive-feature case.

## 8. Turn it on to test

Flags ship off, so a site shows the old behaviour until you force the flag.

Every Jurassic Ninja site already has the Companion plugin, so the command is there with no setup:

```bash
wp companion feature-flag list
wp companion feature-flag enable forms-conditional-logic
wp companion feature-flag disable forms-conditional-logic
wp companion feature-flag reset forms-conditional-logic     # back to the registered default
wp companion feature-flag reset --all --yes
```

`list` prints `flag`, `default`, `override`, `effective`, `owner`, `description`. Read **`effective`**, not `override` — it resolves through the package, so it accounts for every filter, and the two differ whenever code pins the flag.

Overrides are **site-wide**, not per-user: they change what the site does for logged-out visitors too, which is what makes end-to-end testing work.

Enabling a name nothing has registered yet succeeds with a warning, so you can set a flag before the code that registers it reaches the site.

`wp companion` does **not** exist in `jp docker`. For the local loop, the two code filters, the Companion settings page, and the Automattician-only screen on WordPress.com Simple and Atomic, read `jetpack-feature-flag/references/controlling-flags.md`.

## 9. Retire the flag

Flags are temporary. Once the feature ships (or is abandoned), remove it promptly — a stale flag is undocumented permanent config:

1. Delete the `register()` call and the name constant.
2. Collapse `is_enabled()` branches down to the winning path; delete the predicate wrapper and the JS bridge entry.
3. Drop any `jetpack_feature_flag_enabled*` filters that referenced it, in code and in sandbox/mu-plugin patches.
4. Clear stored overrides on sites that have them — `wp companion feature-flag reset <flag>`. A retired flag's override outlives its registration and still resolves.
5. If nothing else in the project uses the package, drop the composer dependency and regenerate the plugin locks again.

## Checklist

- [ ] Flag is genuinely temporary, not config in disguise
- [ ] Dependency declared **and installed** before any code was written
- [ ] Name matches `/^[a-z0-9][a-z0-9_-]*$/`, checked by eye — neither the sniff nor `register()` sees a constant — prefixed with the product area, held in a constant
- [ ] Registered on a hook that fires in every context that reads the flag, not an admin-only one
- [ ] Checks go through one named predicate, with no `class_exists()` guard
- [ ] JS reads the PHP answer through the project's existing state channel
- [ ] Dependent **plugin** lock files regenerated; `git diff --stat` on each is non-empty
- [ ] Changelog entries use each project's own type vocabulary
- [ ] Tests cover both branches; filter removed and `Feature_Flags::reset()` called in the right teardown
- [ ] `jp test php` actually ran tests rather than exiting 0 on an empty suite
- [ ] On a real site: `class_exists()` is true and the flag appears in `Feature_Flags::all()`
- [ ] Verified on JN with `wp companion feature-flag enable <flag>`
