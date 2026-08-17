---
name: jetpack-feature-flag
description: "Use when adding, gating, testing, or retiring a Jetpack feature flag in the monorepo — registering with Feature_Flags::register(), branching on is_enabled(), declaring the automattic/jetpack-feature-flags dependency and regenerating dependent plugin lock files, exposing a flag to the block editor, and forcing a flag on for testing on a Jurassic Ninja site with `wp companion feature-flag`. Triggers on 'add a feature flag', 'put this behind a flag', 'gate this feature', 'feature flag', 'ship this disabled by default', 'kill switch', or 'turn the flag on for testing'."
compatibility: "Jetpack monorepo. Requires the `automattic/jetpack-feature-flags` package (`projects/packages/feature-flags`, PHP 7.2+). The `wp companion feature-flag` command used for testing is preinstalled on every Jurassic Ninja site."
---

# Jetpack Feature Flags

Register a flag, branch on it, ship it off by default, turn it on to test, delete it when the feature lands.

## Is a flag the right tool?

A flag is for **temporary** branching you can change without changing code: gating unreleased work, staged rollout, or a kill switch for something risky.

Reach for something else when the toggle is **permanent** — that is site configuration, a user-facing setting, or a constant. A flag that would live forever is really config wearing a flag's clothes.

## 1. Register the flag

Register **on the hook where the owning feature loads** — not from a global bootstrap, and not lazily inside a request branch. Flags do not need to exist on every request; they need to exist on the requests that read them, and they need to be there *before* the first read.

Registration allocates nothing and stores no state, so within your feature's own load there is no reason to defer or guard it. Call it first thing.

**The read deadlines.** Register before all of these, or the flag is invisible to them:

| Reader | When it reads |
|---|---|
| Your own `is_enabled()` calls | Whenever your code runs |
| Tools → Feature Flags (a8c) | `admin_menu` |
| `wp companion feature-flag list` | WP-CLI command execution |

The canonical example is `projects/packages/forms/src/class-jetpack-forms.php`:

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

Called first thing from the package's loader, `Jetpack_Forms::load_contact_form()`. Follow that call up and the hook is Jetpack's module loader: `projects/plugins/jetpack/modules/contact-form.php` calls it at file scope, and Jetpack requires active module files on `after_setup_theme` at priority `-2` — comfortably before every reader in the table above.

The name is a class constant, so the registration and every check share one spelling.

**A flag only exists where its owning code loads, and that is fine.** The Forms flag registers only when the Forms module is active. On a site where it isn't, the flag is absent from `Feature_Flags::all()`, from the a8c screen, and from `wp companion feature-flag list` — that is correct behaviour, not a bug to work around by hoisting registration somewhere more global. Overrides are still settable by name, because unregistered names pass through the resolution filters.

So: pick the hook your feature already loads on. Do not invent a separate always-on bootstrap just to register flags.

**Naming.** Names must match `/^[a-z0-9][a-z0-9_-]*$/` and should be prefixed with the owning product area (`forms-conditional-logic`, not `conditional-logic`).

The pattern is enforced **only at lint time**, by the `Jetpack.FeatureFlags.FeatureFlagName` PHPCS sniff — `register()` never validates at runtime. So the sniff does not protect flags registered from outside this monorepo, and a name it would reject is stored but cannot be overridden from the control surfaces. Get the name right at registration.

## 2. Gate the code

```php
if ( Feature_Flags::is_enabled( self::CONDITIONAL_LOGIC_FLAG ) ) {
	// The new path.
}
```

Wrap it in a named predicate (`Jetpack_Forms::is_conditional_logic_enabled()`) rather than scattering `is_enabled()` calls — one place to delete when the flag retires.

`is_enabled()` on an unregistered name returns `false` but still runs the filters, so a typo fails silently in the "off" direction. That is why the name lives in a constant.

## 3. Expose it to the block editor, if the feature has JS

Do not re-derive the flag in JS. Bridge the PHP answer so both sides read one source under one name — Forms does this through its editor features array in `class-contact-form-block.php`:

```php
$features[ Jetpack_Forms::CONDITIONAL_LOGIC_FLAG ] = Jetpack_Forms::is_conditional_logic_enabled();
```

Then JS checks it with the package's existing feature-flag helper (`hasFeatureFlag()` in Forms). Use whatever the target package already uses to ship editor flags; do not invent a second channel.

## 4. Declare the dependency — and regenerate the plugin lock files

**This is the step that breaks CI and ships a dead flag if skipped.**

Add the package to the consuming project's `composer.json`:

```json
"require": {
    "automattic/jetpack-feature-flags": "@dev"
}
```

Then regenerate the lock file of **every plugin that bundles that project**. Package `composer.lock` files are gitignored; **plugin** lock files are tracked, and the `lock_files` CI job fails when they drift.

```bash
# Which plugins ship this project?
jp dependencies list packages/<project> --add-dependents --extra build --no-dev | grep '^plugins/'

# Regenerate each one's lock file.
tools/composer-update-monorepo.sh --root-reqs projects/plugins/<plugin>
```

Skipping this fails **soft**, which is worse than failing loudly: the class is not autoloadable in the built plugin, callers guarded with `class_exists()` quietly behave as if no flags exist, and the control screen shows an empty list that looks exactly like "no flags registered yet".

## 5. Changelog

Add an entry to the project you touched. If the flagged change is user-facing, also add one to each plugin that ships it — a package entry never reaches a plugin's changelog. Plugins whose lock file you regenerated in step 4 count as touched and need an entry too.

```bash
jp changelog add packages/<project> -s minor -t added -e "Add a feature flag for <thing>."
```

Use `$$next-version$$` in any `@since` you write. Never substitute a real version.

## 6. Verify

```bash
jp test php packages/<project>
jp phan packages/<project>
composer phpcs:lint -- projects/packages/<project>/
```

Test **both** branches. A flag registered `'default' => false` means the default test run exercises the old path only; force the new one with the per-flag filter:

```php
add_filter( 'jetpack_feature_flag_enabled_my-flag', '__return_true' );
```

Remove it in `tear_down()` — it is a global filter and will leak into later tests.

## 7. Turn it on to test — Jurassic Ninja

Flags ship off, so a JN site shows the old behaviour until you force the flag. Every Jurassic Ninja site already has the Companion plugin, so the command is there — nothing to install:

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

For the full command surface, the Settings-page equivalent, the two code filters, and the Automattician-only screen on WordPress.com Simple and Atomic, read `jetpack-feature-flag/references/controlling-flags.md`.

## 8. Retire the flag

Flags are temporary. Once the feature ships (or is abandoned), remove it promptly — a stale flag is undocumented permanent config:

1. Delete the `register()` call and the name constant.
2. Collapse `is_enabled()` branches down to the winning path; delete the predicate wrapper.
3. Drop any `jetpack_feature_flag_enabled*` filters that referenced it, in code and in sandbox/mu-plugin patches.
4. Clear stored overrides on sites that have them — `wp companion feature-flag reset <flag>` on test sites. A retired flag's override outlives its registration and still resolves.
5. If nothing else in the project uses the package, drop the composer dependency and regenerate the plugin locks again.

## Checklist

- [ ] Flag is genuinely temporary, not config in disguise
- [ ] Name matches `/^[a-z0-9][a-z0-9_-]*$/`, prefixed with the product area, held in a constant
- [ ] `register()` called on the hook the owning feature already loads on, ahead of every reader, with `default`, `description`, `owner`
- [ ] Checks go through one named predicate
- [ ] Editor/JS reads the PHP answer rather than re-deriving it
- [ ] `automattic/jetpack-feature-flags` in the project's `composer.json`
- [ ] Dependent **plugin** lock files regenerated and committed
- [ ] Changelog entries for the project, and for each plugin when user-facing
- [ ] Tests cover both branches; forcing filters removed in teardown
- [ ] `jp test php`, `jp phan`, and PHPCS pass
- [ ] Verified on JN with `wp companion feature-flag enable <flag>`
