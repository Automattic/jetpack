<?php
/**
 * Test stub for the host plugin's Jetpack_Options class.
 *
 * The real class lives in projects/plugins/jetpack and is not autoloaded in the
 * SEO package test context. `Automattic\Jetpack\Modules::get_active()` reads the
 * `active_modules` option through it, so without this stub any code path that
 * calls `Modules::is_active()` (e.g. `Initializer::get_overview_data()` and
 * `Initializer::init()`) fatals with "Class Jetpack_Options not found".
 *
 * Module membership in tests is driven via the `jetpack_active_modules` filter
 * (applied after this option is read), so the stub only needs to return the
 * default.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Jetpack_Options' ) ) {

	/**
	 * Stub of the host plugin's Jetpack_Options.
	 */
	class Jetpack_Options {

		/**
		 * Return the option default. Module state is supplied via the
		 * `jetpack_active_modules` filter in tests, not this store.
		 *
		 * @param string $name    Option name (unused).
		 * @param mixed  $default_value Default to return.
		 * @return mixed
		 */
		public static function get_option( $name, $default_value = false ) {
			return $default_value;
		}
	}
}
