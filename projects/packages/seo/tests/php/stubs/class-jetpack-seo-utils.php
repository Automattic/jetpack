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

		/**
		 * Stub for the host plugin's front-page meta description getter, read by
		 * Initializer::get_settings_data().
		 *
		 * @return string
		 */
		public static function get_front_page_meta_description() {
			return '';
		}
	}
}
