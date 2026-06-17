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

	const PACKAGE_VERSION = '0.1.0';

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
	 * @param string $name Flag name.
	 * @param array  $definition Flag definition.
	 * @return void
	 */
	public static function register( $name, array $definition = array() ) {
		$name = self::normalize_name( $name );

		if ( '' === $name ) {
			return;
		}

		self::$flags[ $name ] = array_merge(
			array(
				'default'     => false,
				'description' => '',
				'owner'       => '',
			),
			$definition
		);

		self::$flags[ $name ]['default'] = (bool) self::$flags[ $name ]['default'];
		self::$flags[ $name ]['name']    = $name;
	}

	/**
	 * Return a registered flag definition.
	 *
	 * @param string $name Flag name.
	 * @return array|null Flag definition, or null when the flag is unknown.
	 */
	public static function get( $name ) {
		$name = self::normalize_name( $name );

		return self::$flags[ $name ] ?? null;
	}

	/**
	 * Return all registered flag definitions.
	 *
	 * @return array<string, array>
	 */
	public static function all() {
		ksort( self::$flags );

		return self::$flags;
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
		$name       = self::normalize_name( $name );
		$definition = self::get( $name );

		if ( null === $definition ) {
			$definition = array(
				'default'     => false,
				'description' => '',
				'owner'       => '',
				'name'        => $name,
			);
		}

		$default = (bool) $definition['default'];

		/**
		 * Filters whether a Jetpack feature flag is enabled.
		 *
		 * @since 0.1.0
		 *
		 * @param bool   $enabled    Whether the flag is enabled. Defaults to the registered default.
		 * @param string $flag_name  Feature flag name.
		 * @param array  $definition Registered feature flag definition.
		 */
		return (bool) apply_filters( 'jetpack_feature_flag_enabled', $default, $name, $definition );
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
	 * Normalize a flag name.
	 *
	 * @param string $name Flag name.
	 * @return string Normalized flag name, or empty string for invalid input.
	 */
	private static function normalize_name( $name ) {
		if ( ! is_string( $name ) ) {
			return '';
		}

		$name = strtolower( $name );
		$name = preg_replace( '/[^a-z0-9_-]/', '', $name );

		return preg_match( '/^[a-z0-9][a-z0-9_-]*$/', $name ) ? $name : '';
	}
}
