<?php
/**
 * Stands in for wpcom's wpcom_site_has_feature(), which reads the features named in the global below.
 *
 * @package automattic/jetpack-videopress
 */

/**
 * Whether the site has the feature.
 *
 * @param string $feature Feature slug.
 * @return bool
 */
function wpcom_site_has_feature( $feature ) {
	return in_array( $feature, $GLOBALS['videopress_test_site_features'] ?? array(), true );
}
