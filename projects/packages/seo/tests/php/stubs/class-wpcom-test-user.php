<?php
/**
 * Controllable WordPress.com visitor identity, read by the `is_automattician()` stub.
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
