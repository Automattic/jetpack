<?php
/**
 * Stand-in for WordPress.com's `wpcom_site_has_feature()`, answering from a test-controlled global.
 *
 * @package automattic/jetpack-activity-log
 */

// phpcs:disable Squiz.Commenting, Generic.Commenting, WordPress.Files.FileName

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	function wpcom_site_has_feature( $feature, $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Matches the real signature.
		return in_array( $feature, $GLOBALS['activity_log_test_wpcom_features'] ?? array(), true );
	}
}
