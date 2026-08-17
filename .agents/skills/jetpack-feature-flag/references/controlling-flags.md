# Controlling Jetpack feature flags

Everything that can change a flag's answer, and where each one applies.

- [Resolution order](#resolution-order)
- [Code filters](#code-filters)
- [Jurassic Ninja: the Companion WP-CLI command](#jurassic-ninja-the-companion-wp-cli-command)
- [Companion settings page](#companion-settings-page)
- [WordPress.com Simple and Atomic: the Automattician screen](#wordpresscom-simple-and-atomic-the-automattician-screen)
- [Which surface to reach for](#which-surface-to-reach-for)

## Resolution order

`Feature_Flags::is_enabled( $name )` resolves in exactly this order:

1. The `default` the flag was registered with (`false` for an unregistered name).
2. `apply_filters( 'jetpack_feature_flag_enabled', $enabled, $name, $definition )` — the generic filter. **Every storage-backed control surface answers here**: the Companion plugin, and the wpcom Automattician screen.
3. `apply_filters( "jetpack_feature_flag_enabled_{$name}", $enabled, $definition )` — the per-flag filter.

**The per-flag filter runs last and wins.** A sandbox patch or mu-plugin using it beats anything set through a UI or the CLI. When a flag will not budge, look for one of these before assuming the override failed.

Unregistered names pass through both filters, so a flag can be forced before the code registering it reaches the site.

## Code filters

Force one flag, anywhere the package is loaded:

```php
add_filter( 'jetpack_feature_flag_enabled_forms-conditional-logic', '__return_true' );
```

Policy across many flags — a cohort, a percentage rollout, staff-only:

```php
add_filter(
	'jetpack_feature_flag_enabled',
	static function ( bool $enabled, string $flag_name, array $definition ): bool {
		if ( 'forms-conditional-logic' === $flag_name && is_automattician() ) {
			return true;
		}

		return $enabled;
	},
	10,
	3
);
```

Filters can be added at any time — they are read when `is_enabled()` runs, not when the flag is registered.

On a JN or self-hosted site, drop either snippet in `wp-content/mu-plugins/`. Prefer the CLI below for routine testing: it survives a re-sync of the plugin directory, and it is visible to anyone else looking at the site.

## Jurassic Ninja: the Companion WP-CLI command

Every Jurassic Ninja site comes with the Companion plugin, so these commands are available with no setup.

```bash
wp companion feature-flag list [--format=table|csv|json|yaml|count]
wp companion feature-flag enable <flag>
wp companion feature-flag disable <flag>
wp companion feature-flag reset <flag>
wp companion feature-flag reset --all [--yes]
```

### Reading `list`

Columns: `flag`, `default`, `override`, `effective`, `owner`, `description`.

- **`default`** — what `register()` declared. `-` for a flag only present as a stored override.
- **`override`** — what this site has forced. `-` when nothing is stored.
- **`effective`** — what `is_enabled()` actually returns right now, resolved through the package, so it accounts for every filter including the per-flag one. **This is the column to trust.**

`effective` differing from `override` means something in code is pinning the flag. That is the signal to go looking for a per-flag filter.

Flags with a stored override that nobody registers are listed too, described as `Not registered on this site.` — stale, set ahead of the code landing, or belonging to a feature that is not loaded here.

**A flag you expect to see may be legitimately absent.** Registration happens on the hook where the owning feature loads, so a flag whose module or feature is inactive on this site never registers and never appears. Activate the owning feature, or set the override by name anyway — unregistered names are accepted and still resolve.

### Behaviour worth knowing

- **Overrides are site-wide.** They apply to logged-out visitors, which is what makes end-to-end testing possible — and means an override changes what everyone sees.
- **Unregistered names are accepted**, with a warning, so a flag can be set before its code arrives.
- **Names are validated** against `/^[a-z0-9][a-z0-9_-]*$/`; an invalid name is a hard error, not a silent drop.
- **`reset --all` confirms** unless `--yes` is passed.
- **Success is reported from what was stored**, not what was requested, so a normalized-away write reports an error rather than a false success.
- **Without the Jetpack feature flags package loaded**, `list` warns that no flags can be discovered and prints `effective` as `-` rather than `off` — an unknowable state, not a resolved one.

Storage is the Companion plugin's own `jetpack_feature_flags` option, applied through the generic `jetpack_feature_flag_enabled` filter.

## Companion settings page

Companion also renders a feature-flags section on the WordPress Settings screen, backed by the same option, with a radio per flag (default / on / off). The section is hidden when the Jetpack package is absent, though the option still sanitizes and stores. Use it when clicking is easier than a shell; the CLI is the same data.

## WordPress.com Simple and Atomic: the Automattician screen

On Simple and Atomic, `jetpack-mu-wpcom` ships **Tools → Feature Flags (a8c)** (`Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Feature_Flags`).

- **Automatticians only**, and it fails closed at every step. On Simple it consults the platform's `is_automattician()`. On Atomic it needs an a8c-proxied request *plus a positive "not a support session" verdict from wpcomsh* — a missing detector or a missing detection result counts as a support session and keeps the screen shut, so the proxy constant alone is not enough. `manage_options` is required on top, and the menu entry, the screen, and the save path are each gated independently.
- **Overrides are site-wide**, stored in the `wpcom_feature_flag_overrides` option (non-autoloaded, deleted when the last override is cleared). They change what the site's owner and logged-out visitors see — the screen says so in a standing warning.
- Same three-state control per flag, and the same **Effective** column semantics as the CLI.
- A flag whose name fails the pattern is listed without a control, since an override for it could not be stored.

This is a different option from Companion's, but both answer the same generic filter, so the resolution order above is unchanged.

## Which surface to reach for

| Situation | Use |
|---|---|
| Testing on a Jurassic Ninja site | `wp companion feature-flag enable <flag>` |
| Automated setup / scripted test runs | Same CLI, with `--format=json` and `--yes` |
| Clicking through on a site you already have open | Companion settings section |
| A wpcom Simple or Atomic site, as an Automattician | Tools → Feature Flags (a8c) |
| PHPUnit | `add_filter( 'jetpack_feature_flag_enabled_<flag>', '__return_true' )`, removed in teardown |
| Rollout policy, cohorts, staff-only | Generic `jetpack_feature_flag_enabled` filter in code |
| Flag will not change no matter what you set | Look for a per-flag filter — it runs last and wins |
