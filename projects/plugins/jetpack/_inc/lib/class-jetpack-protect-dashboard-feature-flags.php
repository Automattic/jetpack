<?php
/**
 * Protect dashboard feature flags.
 *
 * @package automattic/jetpack
 */

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
	}

	/**
	 * Drop the module from the available list while the flag is off, which also keeps it from loading.
	 *
	 * WordPress.com Simple sites keep their current security pages, so it stays off there too.
	 *
	 * @param array $modules Available modules, keyed by slug.
	 * @return array
	 */
	public static function filter_available_modules( $modules ) {
		if ( ! Feature_Flags::is_enabled( self::DASHBOARD ) || ( new Host() )->is_wpcom_simple() ) {
			unset( $modules[ self::MODULE ] );
		}
		return $modules;
	}
}

Jetpack_Protect_Dashboard_Feature_Flags::register();
