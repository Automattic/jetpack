<?php
/**
 * Stand-ins for the WordPress.com feature functions, driven by `$GLOBALS['wpcom_test_features']`.
 *
 * Maps a feature slug to whether the site has it; a slug missing from the map does not exist.
 * Only require this from a test running in a separate process.
 *
 * @package automattic/jetpack-forms
 */

/**
 * Whether the feature is known to WordPress.com.
 *
 * @param string $feature Feature slug.
 * @return bool
 */
function wpcom_feature_exists( $feature ) {
	return array_key_exists( $feature, $GLOBALS['wpcom_test_features'] ?? array() );
}

/**
 * Whether the site's plan includes the feature.
 *
 * @param string $feature Feature slug.
 * @param int    $blog_id Unused.
 * @return bool
 */
function wpcom_site_has_feature( $feature, $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Matches the real signature.
	return ! empty( $GLOBALS['wpcom_test_features'][ $feature ] );
}
