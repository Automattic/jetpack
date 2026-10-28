<?php
/**
 * Stand-ins for the WordPress.com feature functions, driven by `$GLOBALS['wpcom_test_features']`.
 *
 * @package automattic/jetpack-protect-status
 */

/**
 * Whether the simulated WordPress.com platform gates this feature.
 *
 * @param string $feature Feature slug.
 * @return bool
 */
function wpcom_feature_exists( $feature ) {
	return in_array( $feature, $GLOBALS['wpcom_test_features']['known'] ?? array(), true );
}

/**
 * Whether the simulated WordPress.com site has this feature.
 *
 * @param string $feature Feature slug.
 * @return bool
 */
function wpcom_site_has_feature( $feature ) {
	return in_array( $feature, $GLOBALS['wpcom_test_features']['entitled'] ?? array(), true );
}
