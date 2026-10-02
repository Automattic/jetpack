<?php
/**
 * Stand-in for the wpcom-only Freshly Pressed plugin, which the Simple-site path
 * calls. The real class doesn't exist in the WorDBless test environment, so it
 * never shadows this one.
 *
 * Tests drive this through `$GLOBALS['jetpack_newsletter_wpcom_doubles']` rather
 * than by touching the class directly: `tests/php/lib/` is excluded from Phan
 * (see .phan/config.php), so a direct reference would read as an undeclared class.
 *
 * @package automattic/jetpack-newsletter
 */

if ( ! class_exists( 'FreshlyPressed' ) ) {
	/**
	 * Test double for the wpcom Freshly Pressed plugin.
	 */
	class FreshlyPressed {
		/**
		 * Return the canned result, recording the arguments it was asked for.
		 *
		 * @param array $args Query arguments.
		 * @return mixed
		 */
		public static function get_available_posts( $args = array() ) {
			$GLOBALS['jetpack_newsletter_wpcom_doubles']['last_args'] = $args;
			return $GLOBALS['jetpack_newsletter_wpcom_doubles']['freshly_pressed'] ?? null;
		}
	}
}
