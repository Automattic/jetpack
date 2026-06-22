# Jetpack Feature Flags

Shared utilities for registering and checking lightweight feature flags in Jetpack packages and plugins.

This package intentionally does not store flag state. Consumers register flags with defaults, then external code can control them through the `jetpack_feature_flag_enabled` filter.

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
