<?php
/**
 * Protect dashboard module availability.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Hides the `protect-dashboard` module while the Jetpack Protect plugin is active.
 *
 * @since 16.4
 */
class Jetpack_Protect_Dashboard_Feature_Flags {

	const MODULE = 'protect-dashboard';

	/**
	 * Set while computing defaults as if the Jetpack Protect plugin were not active.
	 *
	 * @var bool
	 */
	private static $ignore_protect_plugin = false;

	/**
	 * Register the module filters.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'jetpack_get_available_modules', array( __CLASS__, 'filter_available_modules' ) );
		add_filter( 'jetpack_get_default_modules', array( __CLASS__, 'filter_default_modules' ), 10, 5 );
	}

	/**
	 * Whether the Jetpack Protect plugin is active, whose own page the module would take over until JETPACK-3062.
	 *
	 * @return bool
	 */
	public static function is_protect_plugin_active() {
		return Constants::is_defined( 'JETPACK_PROTECT_VERSION' );
	}

	/**
	 * Drop the module from the available list while the Jetpack Protect plugin is active, which also keeps it from loading.
	 *
	 * Jetpack keeps an unavailable module in its stored active list.
	 *
	 * @param array $modules Available modules, keyed by slug.
	 * @return array
	 */
	public static function filter_available_modules( $modules ) {
		if ( ! self::$ignore_protect_plugin && self::is_protect_plugin_active() ) {
			unset( $modules[ self::MODULE ] );
		}
		return $modules;
	}

	/**
	 * Keep the module a default while the Jetpack Protect plugin hides it, so the page appears once that plugin is gone.
	 *
	 * @param array       $modules                  Default module slugs.
	 * @param bool|string $min_version              Only modules introduced after this version.
	 * @param bool|string $max_version              Only modules introduced in or before this version.
	 * @param bool|null   $requires_connection      Only modules that do, or don't, require a connection.
	 * @param bool|null   $requires_user_connection Only modules that do, or don't, require a user connection.
	 * @return array
	 */
	public static function filter_default_modules( $modules, $min_version = false, $max_version = false, $requires_connection = null, $requires_user_connection = null ) {
		if ( self::$ignore_protect_plugin || ! self::is_protect_plugin_active() || in_array( self::MODULE, $modules, true ) ) {
			return $modules;
		}

		$defaults                    = array();
		self::$ignore_protect_plugin = true;
		try {
			$defaults = Jetpack::get_default_modules( $min_version, $max_version, $requires_connection, $requires_user_connection );
		} finally {
			self::$ignore_protect_plugin = false;
		}

		if ( in_array( self::MODULE, $defaults, true ) ) {
			$modules[] = self::MODULE;
		}
		return $modules;
	}
}

Jetpack_Protect_Dashboard_Feature_Flags::register();
