<?php
/**
 * Test stub for the host plugin's Jetpack_SEO_Utils class.
 *
 * The real class lives in projects/plugins/jetpack and is not autoloaded in the
 * SEO package test context. Schema_Builder guards on it with class_exists(), so
 * this controllable stand-in lets tests toggle whether the feature is enabled.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Jetpack_SEO_Utils' ) ) {

	/**
	 * Stub of the host plugin's Jetpack_SEO_Utils.
	 */
	class Jetpack_SEO_Utils {

		/**
		 * Whether the SEO feature reports as enabled.
		 *
		 * @var bool
		 */
		public static $enabled = true;

		/**
		 * Stub for the host plugin's feature check.
		 *
		 * @return bool
		 */
		public static function is_enabled_jetpack_seo() {
			return self::$enabled;
		}
	}
}
