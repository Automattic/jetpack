<?php
/**
 * Test stub for the wpcom mu-plugin function My Jetpack calls to serve purchases locally on
 * WordPress.com Simple. Returns whatever the test placed in $GLOBALS['__mj_test_local_purchases']
 * (null by default), mirroring how the real function returns null to fall through to the fetch.
 *
 * Only ever loaded inside `@runInSeparateProcess` tests so this definition never leaks into the
 * shared process and short-circuits the normal-fetch tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\WPCOM\My_Jetpack;

if ( ! function_exists( 'Automattic\WPCOM\My_Jetpack\get_site_purchases' ) ) {
	/**
	 * @return null|array|object|\WP_Error
	 */
	function get_site_purchases() {
		return $GLOBALS['__mj_test_local_purchases'] ?? null;
	}
}
