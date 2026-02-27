<?php
/**
 * Mock wpcom feature functions for testing WoA behavior.
 *
 * Defines wpcom_feature_exists() and wpcom_site_has_feature() in the global
 * namespace, controlled by $GLOBALS['wpcom_test_feature_exists'] and
 * $GLOBALS['wpcom_test_site_features'].
 *
 * @package automattic/my-jetpack
 */

if ( ! function_exists( 'wpcom_feature_exists' ) ) {
	/**
	 * Mock wpcom_feature_exists().
	 *
	 * @param string $feature Feature slug.
	 * @return bool
	 */
	function wpcom_feature_exists( $feature ) {
		return isset( $GLOBALS['wpcom_test_feature_exists'] )
			&& in_array( $feature, $GLOBALS['wpcom_test_feature_exists'], true );
	}
}

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * Mock wpcom_site_has_feature().
	 *
	 * @param string $feature Feature slug.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		return isset( $GLOBALS['wpcom_test_site_features'] )
			&& in_array( $feature, $GLOBALS['wpcom_test_site_features'], true );
	}
}
