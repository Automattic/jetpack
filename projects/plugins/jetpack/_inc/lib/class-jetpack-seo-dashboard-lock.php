<?php
/**
 * Prototype: pause the SEO modules while the SEO dashboard is off.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Keeps the SEO modules from running while the `seo-dashboard` module is off, without changing which ones are saved as on.
 */
class Jetpack_Seo_Dashboard_Lock {

	const DASHBOARD = 'seo-dashboard';

	const MODULES = array( 'seo-tools', 'sitemaps', 'canonical-urls', 'verification-tools' );

	/**
	 * Register the module filter.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'pause_modules' ) );
	}

	/**
	 * Drop the SEO modules from the active list while the dashboard is off.
	 *
	 * The saved list keeps them, so switching the dashboard back on restores what was on before.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public static function pause_modules( $modules ) {
		$saved = Jetpack_Options::get_option( 'active_modules', array() );
		if ( is_array( $saved ) && in_array( self::DASHBOARD, $saved, true ) ) {
			return $modules;
		}

		return array_values( array_diff( (array) $modules, self::MODULES ) );
	}
}

Jetpack_Seo_Dashboard_Lock::register();
