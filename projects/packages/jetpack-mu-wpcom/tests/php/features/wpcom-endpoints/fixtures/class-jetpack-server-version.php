<?php
/**
 * Stand-in for WordPress.com's Jetpack_Server_Version, which reads the signed Jetpack token off a request.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! class_exists( 'Jetpack_Server_Version' ) ) {
	/**
	 * Hands back whatever token a test put in `$GLOBALS['wpcom_paypal_platform_test_token']`, as if its signature had checked out.
	 */
	class Jetpack_Server_Version {
		/**
		 * The token the current request is signed with; false for an unsigned request.
		 *
		 * @return object|false|WP_Error
		 */
		public static function get_token_from_authorization_header() {
			return $GLOBALS['wpcom_paypal_platform_test_token'] ?? false;
		}
	}
}
