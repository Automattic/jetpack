<?php
/**
 * Test stubs for WordPress.com proxy helpers.
 *
 * @package automattic/jetpack-search
 */

// @phan-file-suppress PhanRedefineFunction -- Test stubs are runtime-guarded; Phan also loads WPCOM function stubs.

if ( ! function_exists( 'is_automattician' ) ) {
	$GLOBALS['jetpack_test_controls_is_automattician'] = true;

	/**
	 * Test stub for the WordPress.com Automattician helper.
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	function is_automattician( $user_id = 0 ) {
		return 0 <= (int) $user_id && ! empty( $GLOBALS['jetpack_test_is_automattician'] );
	}
}

if ( ! function_exists( 'wpcom_is_proxied_request' ) ) {
	$GLOBALS['jetpack_test_controls_wpcom_is_proxied_request'] = true;

	/**
	 * Test stub for the WordPress.com proxied request helper.
	 *
	 * @return bool
	 */
	function wpcom_is_proxied_request() {
		return ! empty( $GLOBALS['jetpack_test_wpcom_is_proxied_request'] );
	}
}
