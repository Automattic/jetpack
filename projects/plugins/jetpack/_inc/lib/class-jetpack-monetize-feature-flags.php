<?php
/**
 * Monetize dashboard feature flag.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Monetize\Dashboard;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the flag that gates the `monetize` module.
 *
 * @since $$next-version$$
 */
class Jetpack_Monetize_Feature_Flags {

	const MODULE = 'monetize';

	/**
	 * Register the flag and the module filter.
	 *
	 * @return void
	 */
	public static function register() {
		// Another plugin may have loaded the classes without the Monetize package.
		if ( class_exists( Dashboard::class ) ) {
			Dashboard::register_feature_flag();
		}

		add_filter( 'jetpack_get_available_modules', array( __CLASS__, 'filter_available_modules' ) );
	}

	/**
	 * Drop the module from the available list while the flag is off, which also keeps it from loading.
	 *
	 * It stays off on the wpcom platform too, where the dashboard adds no page: see the package README.
	 *
	 * @param array $modules Available modules, keyed by slug.
	 * @return array
	 */
	public static function filter_available_modules( $modules ) {
		if ( ! class_exists( Dashboard::class ) || ! Dashboard::is_enabled() || ( new Host() )->is_wpcom_platform() ) {
			unset( $modules[ self::MODULE ] );
		}
		return $modules;
	}
}

Jetpack_Monetize_Feature_Flags::register();
