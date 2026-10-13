<?php
/**
 * Test stub for the Jetpack plugin's canonical URL resolver, which the package loads by path.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Jetpack_Canonical_Urls_Resolver' ) ) {

	/**
	 * Stub of the Jetpack plugin's Jetpack_Canonical_Urls_Resolver.
	 */
	class Jetpack_Canonical_Urls_Resolver {

		/**
		 * URL returned to the printer.
		 *
		 * @var string
		 */
		public static $url = '';

		/**
		 * Stub for the resolver's current-page lookup.
		 *
		 * @return string
		 */
		public static function get_canonical_url() {
			return self::$url;
		}
	}
}
