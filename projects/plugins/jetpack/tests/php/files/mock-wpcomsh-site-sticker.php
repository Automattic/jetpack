<?php
/**
 * Stands in for wpcomsh's Atomic sticker reader. Tests list the active stickers in a global.
 *
 * Loaded by the test that needs it rather than from the bootstrap, so that the tests for a
 * site with no sticker reader at all still run against a process where there is none.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
	/**
	 * @param string $sticker_name The sticker name.
	 * @return bool
	 */
	function wpcomsh_is_site_sticker_active( $sticker_name ) {
		return in_array( $sticker_name, $GLOBALS['jetpack_test_site_stickers'] ?? array(), true );
	}
}
