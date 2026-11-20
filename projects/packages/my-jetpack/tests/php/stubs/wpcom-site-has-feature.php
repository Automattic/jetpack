<?php
/**
 * Test stub for wpcom_site_has_feature(), which WordPress.com provides at runtime.
 *
 * @package automattic/my-jetpack
 */

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * Whether the site's plan includes a feature, from the test's list.
	 *
	 * @param string $feature The feature slug.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		return in_array( $feature, $GLOBALS['my_jetpack_test_site_features'] ?? array(), true );
	}
}
