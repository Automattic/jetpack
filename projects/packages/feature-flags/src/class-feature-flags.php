<?php
/**
 * Lightweight feature flag registry.
 *
 * @package automattic/jetpack-feature-flags
 */

namespace Automattic\Jetpack\Feature_Flags;

/**
 * Registers feature flag metadata and resolves flag state.
 */
class Feature_Flags {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Registered feature flags.
	 *
	 * @var array<string, array>
	 */
	private static $flags = array();

	/**
	 * Register a feature flag.
	 *
	 * Supported definition keys:
	 * - default: bool Whether the flag is enabled by default.
	 * - description: string Human-readable description.
	 * - owner: string Owning package, plugin, or product area.
	 *
	 * Flag names must match /^[a-z0-9][a-z0-9_-]*$/. This is enforced at lint
	 * time by the `Jetpack.FeatureFlags.FeatureFlagName` PHPCS sniff rather than
	 * at runtime, so registration stays allocation-free on the hot path.
	 *
	 * @param string $name Flag name.
	 * @param array  $definition Flag definition.
	 * @return void
	 */
	public static function register( $name, array $definition = array() ) {
		$definition            = array_merge( self::default_definition( $name ), $definition );
		$definition['default'] = (bool) $definition['default'];
		$definition['name']    = $name;

		self::$flags[ $name ] = $definition;
	}

	/**
	 * Return a registered flag definition.
	 *
	 * @param string $name Flag name.
	 * @return array|null Flag definition, or null when the flag is unknown.
	 */
	public static function get( $name ) {
		return self::$flags[ $name ] ?? null;
	}

	/**
	 * Return all registered flag definitions.
	 *
	 * @return array<string, array>
	 */
	public static function all() {
		$flags = self::$flags;
		ksort( $flags );

		return $flags;
	}

	/**
	 * Return whether a feature flag is enabled.
	 *
	 * Unknown flags default to false but still pass through the global filter.
	 *
	 * @param string $name Flag name.
	 * @return bool Whether the flag is enabled.
	 */
	public static function is_enabled( $name ) {
		$definition = self::get( $name );

		if ( null === $definition ) {
			$definition = self::default_definition( $name );
		}

		$default = (bool) $definition['default'];

		/**
		 * Filters whether a Jetpack feature flag is enabled.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool   $enabled    Whether the flag is enabled. Defaults to the registered default.
		 * @param string $flag_name  Feature flag name.
		 * @param array  $definition Registered feature flag definition.
		 */
		$enabled = (bool) apply_filters( 'jetpack_feature_flag_enabled', $default, $name, $definition );

		/**
		 * Filters whether a specific Jetpack feature flag is enabled.
		 *
		 * The dynamic portion of the hook name, `$name`, refers to the feature flag name.
		 * This mirrors the WordPress `option_{$option}` convention so a single flag can be
		 * toggled with a `__return_true`/`__return_false` one-liner.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $enabled    Whether the flag is enabled.
		 * @param array $definition Registered feature flag definition.
		 */
		return (bool) apply_filters( "jetpack_feature_flag_enabled_{$name}", $enabled, $definition );
	}

	/**
	 * Clear registered flags.
	 *
	 * Intended for tests.
	 *
	 * @return void
	 */
	public static function reset() {
		self::$flags = array();
	}

	/**
	 * Build the default definition for a flag.
	 *
	 * @param string $name Flag name.
	 * @return array Default flag definition.
	 */
	private static function default_definition( $name ) {
		return array(
			'default'     => false,
			'description' => '',
			'owner'       => '',
			'name'        => $name,
		);
	}
}
