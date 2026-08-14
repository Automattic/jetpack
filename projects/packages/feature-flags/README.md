# Jetpack Feature Flags

Shared utilities for registering and checking lightweight feature flags in Jetpack packages and plugins.

This package intentionally does not store flag state. Consumers register flags with defaults, then external code can control them through the `jetpack_feature_flag_enabled` filter.

## When To Use a Feature Flag

A feature flag is for **temporary** branching where you need to change behaviour without changing code:

- **Gating unreleased work** — merge and ship in-progress code disabled by default, then turn it on when it is ready.
- **Gradual rollout** — let a policy layer hook the filter to enable a flag for a percentage of sites, a cohort, or staff only.
- **Kill switch** — ship a risky feature behind a flag so it can be disabled in production without a deploy.

Reach for something else when the toggle is **permanent**: site configuration, a user-facing setting/preference, or a plain constant. If a flag would live forever, it is really config and should graduate to a real setting.

## When To Register

Register flags **unconditionally, as early as your code loads** — at package init or plugin bootstrap, before anything calls `is_enabled()`. Registration is cheap and stores no state, so there is no reason to defer or guard it. Registering every flag up front (rather than lazily, deep inside a request branch) means the full set is always discoverable through `Feature_Flags::all()` for tooling, debugging, and admin listings.

The controlling filter, by contrast, can be added at any time — it is read when `is_enabled()` runs, not when the flag is registered.

## Naming and Ownership

- **Name** — must match `/^[a-z0-9][a-z0-9_-]*$/` (lint-enforced; see [Usage](#usage)). Prefix it with the owning product or area so flags read clearly and don't collide, e.g. `newsletter-new-subscribe-form`.
- **`owner`** — the package, plugin, or product area responsible for the flag, so others know who to ask before flipping it.
- **`description`** — a short, human-readable explanation of what the flag gates.

## Retiring a Flag

Flags are temporary. Once a feature is fully shipped (or fully abandoned), remove the flag promptly: delete the `register()` call, collapse the `is_enabled()` branches down to the winning path, and drop any filter overrides that referenced it. Leaving stale flags behind turns them into permanent, undocumented config and makes the codebase harder to reason about.

## Usage

```php
use Automattic\Jetpack\Feature_Flags\Feature_Flags;

Feature_Flags::register(
	'my-product-new-flow',
	array(
		'default'     => false,
		'description' => 'Enable the new product flow.',
		'owner'       => 'my-product',
	)
);

if ( Feature_Flags::is_enabled( 'my-product-new-flow' ) ) {
	// Load the feature.
}
```

Flag names must match `/^[a-z0-9][a-z0-9_-]*$/`. This is enforced at lint time by the `Jetpack.FeatureFlags.FeatureFlagName` PHPCS sniff (so there is no runtime cost); normalize any dynamic or user-supplied input before registering.

## Controlling Flags

Feature flag state is resolved through a single filter:

```php
add_filter(
	'jetpack_feature_flag_enabled',
	static function ( bool $enabled, string $flag_name, array $definition ): bool {
		if ( 'my-product-new-flow' === $flag_name ) {
			return true;
		}

		return $enabled;
	},
	10,
	3
);
```

The registered default is passed as the first argument. Unknown flags default to `false`, but still pass through the same filter.

A dynamic per-flag variant, `jetpack_feature_flag_enabled_{$flag_name}`, runs after the generic filter. It mirrors WordPress's `option_{$option}` convention, so a single flag can be toggled with a one-liner:

```php
add_filter( 'jetpack_feature_flag_enabled_my-product-new-flow', '__return_true' );
```

## Using This Package In Your WordPress Plugin

If you plan on using this package in your WordPress plugin, we recommend using [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader for maximum interoperability with other plugins that use this package.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Feature Flags is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).
