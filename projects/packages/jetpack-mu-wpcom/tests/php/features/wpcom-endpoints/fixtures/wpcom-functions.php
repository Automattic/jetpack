<?php
/**
 * Stand-ins for WordPress.com global functions the PayPal platform endpoint calls.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'is_suspended' ) ) {
	/**
	 * True for the blogs a test listed in `$GLOBALS['wpcom_paypal_platform_test_suspended']`.
	 *
	 * @param int $blog_id The blog to check.
	 * @return bool
	 */
	function is_suspended( $blog_id ) {
		return in_array( (int) $blog_id, $GLOBALS['wpcom_paypal_platform_test_suspended'] ?? array(), true );
	}
}
