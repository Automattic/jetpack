<?php
/**
 * Stubs for WordPress.com/WoA global functions used by the masterbar tests.
 *
 * @package automattic/jetpack-masterbar
 */

if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
	/**
	 * Test stub for the wpcomsh helper. Returns whatever the test set on the
	 * `jetpack_masterbar_test_site_purchases` global, defaulting to no purchases.
	 *
	 * @return object[]
	 */
	function wpcom_get_site_purchases() {
		return $GLOBALS['jetpack_masterbar_test_site_purchases'] ?? array();
	}
}
