<?php
/**
 * Plugin Name: Boost E2E Premium Features Mocker
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

/**
 * Mock premium features for E2E testing.
 * This plugin uses the proper filter hooks to override premium feature availability.
 */

/**
 * Store the mocked features in a global option
 *
 * @return array The mocked premium features.
 */
function e2e_get_mocked_premium_features() {
	return get_option( 'e2e_mock_premium_features', array() );
}

/**
 * Set the mocked premium features
 *
 * @param array $features List of features to mock.
 */
function e2e_set_mocked_premium_features( $features ) {
	if ( empty( $features ) ) {
		delete_option( 'e2e_mock_premium_features' );
	} else {
		update_option( 'e2e_mock_premium_features', $features, false );
	}
}

/**
 * Set up premium feature filters
 */
function e2e_setup_premium_feature_filters() {
	$premium_features = array(
		'cloud-critical-css',
		'image-size-analysis',
		'performance-history',
		'image-cdn-liar',
		'image-cdn-quality',
		'support',
		'page-cache',
		'cornerstone-10-pages',
	);

	foreach ( $premium_features as $feature ) {
		add_filter( "jetpack_boost_has_feature_{$feature}", 'e2e_mock_premium_feature_check', 10, 1 );
	}
}

/**
 * Mock premium feature check
 *
 * @param bool $has_feature Original feature availability.
 * @return bool Whether the feature should be available.
 */
function e2e_mock_premium_feature_check( $has_feature ) {
	$mocked_features = e2e_get_mocked_premium_features();

	// Get the current filter name to determine which feature is being checked
	$current_filter = current_filter();
	$feature        = str_replace( 'jetpack_boost_has_feature_', '', $current_filter );

	// If this feature is in our mocked list, return true
	if ( in_array( $feature, $mocked_features, true ) ) {
		return true;
	}

	// Otherwise, return the original value
	return $has_feature;
}

// Hook into the premium feature filters
add_action( 'init', 'e2e_setup_premium_feature_filters' );

/**
 * Clean up on deactivation
 */
register_deactivation_hook( __FILE__, 'e2e_premium_features_cleanup' );

/**
 * Cleanup function
 */
function e2e_premium_features_cleanup() {
	delete_option( 'e2e_mock_premium_features' );
}
