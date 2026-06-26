<?php
/**
 * Test stub for the WordPress.com-only `get_user_attribute` function.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'get_user_attribute' ) ) {
	/**
	 * Stub of the WordPress.com-only `get_user_attribute`, controllable via the
	 * `$GLOBALS['_test_user_attributes']` array in tests.
	 *
	 * @param int    $user_id User ID (unused).
	 * @param string $key     Attribute key.
	 * @return mixed
	 */
	function get_user_attribute( $user_id, $key ) {
		return $GLOBALS['_test_user_attributes'][ $key ] ?? false;
	}
}
