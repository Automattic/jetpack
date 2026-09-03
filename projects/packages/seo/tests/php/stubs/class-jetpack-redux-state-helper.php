<?php
/**
 * Test stub for the host plugin's Jetpack_Redux_State_Helper class.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Jetpack_Redux_State_Helper' ) ) {

	/**
	 * Stub of the host plugin's representative-image helper.
	 */
	class Jetpack_Redux_State_Helper {

		/**
		 * Representative image returned to the dashboard.
		 *
		 * @var string
		 */
		public static $site_image = '';

		/**
		 * Return the configured representative image.
		 *
		 * @return string
		 */
		public static function get_site_image(): string {
			return self::$site_image;
		}
	}
}
