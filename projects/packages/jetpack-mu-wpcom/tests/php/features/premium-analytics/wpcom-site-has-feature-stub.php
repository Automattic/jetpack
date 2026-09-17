<?php
/**
 * Stand-in for the platform's plan feature gate, driven by a global.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * Whether the test site's plan carries a feature.
	 *
	 * @param string $feature Feature slug.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		return in_array( $feature, $GLOBALS['wpcom_test_site_features'] ?? array(), true );
	}
}
