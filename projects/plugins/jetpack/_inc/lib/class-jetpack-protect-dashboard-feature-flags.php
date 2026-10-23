<?php
/**
 * Protect dashboard feature flags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the flag that gates the `protect-dashboard` module.
 *
 * @since 16.4
 */
class Jetpack_Protect_Dashboard_Feature_Flags {

	const DASHBOARD = 'jetpack-protect-dashboard';

	const MODULE = 'protect-dashboard';

	/**
	 * Register the flag, and hide the module while it is off.
	 *
	 * @return void
	 */
	public static function register() {
		Feature_Flags::register(
			self::DASHBOARD,
			array(
				'default'     => true,
				'description' => 'Make the Protect dashboard module available, which replaces the Protect page, including the Jetpack Protect plugin\'s. Not for sites using that plugin until the new page matches it.',
				'owner'       => 'jetpack',
			)
		);

		add_filter( 'jetpack_get_available_modules', array( __CLASS__, 'filter_available_modules' ) );
		add_filter( 'jetpack_get_default_modules', array( __CLASS__, 'filter_default_modules' ) );
	}

	/**
	 * Drop the module from the available list while the flag is off, which also keeps it from loading.
	 *
	 * WordPress.com sites keep their current security pages until JETPACK-3035, so it stays off there too.
	 *
	 * @param array $modules Available modules, keyed by slug.
	 * @return array
	 */
	public static function filter_available_modules( $modules ) {
		if ( ! Feature_Flags::is_enabled( self::DASHBOARD ) || ( new Host() )->is_wpcom_platform() ) {
			unset( $modules[ self::MODULE ] );
		}
		return $modules;
	}

	/**
	 * Don't turn the module on by default while the Jetpack Protect plugin is active, since the page would take over that plugin's own.
	 *
	 * See JETPACK-3062.
	 *
	 * @param array $modules Default module slugs.
	 * @return array
	 */
	public static function filter_default_modules( $modules ) {
		if ( Constants::is_defined( 'JETPACK_PROTECT_VERSION' ) ) {
			$modules = array_values( array_diff( $modules, array( self::MODULE ) ) );
		}
		return $modules;
	}
}

Jetpack_Protect_Dashboard_Feature_Flags::register();
