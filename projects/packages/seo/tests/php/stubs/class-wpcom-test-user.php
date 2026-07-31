<?php
/**
 * Controllable stand-in for the WordPress.com visitor identity.
 *
 * Drives the `is_automattician()` stub in `wpcom-user-functions.php`, which is
 * what `Admin_Page::get_tracks_context()` reads for its `is_a11n` property.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Wpcom_Test_User' ) ) {
	/**
	 * Simulated WordPress.com visitor.
	 */
	class Wpcom_Test_User {
		/**
		 * Whether the simulated visitor is an Automattician.
		 *
		 * @var bool
		 */
		public static $is_automattician = false;

		/**
		 * Restore the default (non-Automattician) visitor.
		 */
		public static function reset() {
			self::$is_automattician = false;
		}
	}
}
