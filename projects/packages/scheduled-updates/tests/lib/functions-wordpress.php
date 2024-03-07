<?php
/**
 * Functions that mock WordPress core functionality for testing purposes.
 *
 * @package automattic/scheduled-updates
 */

if ( ! function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
	/**
	 * A drop-in for a WordPress.com function.
	 *
	 * @param string $class_name The name of the class to load.
	 */
	function wpcom_rest_api_v2_load_plugin( $class_name ) {
		global $wpcom_rest_api_v2_plugins;

		if ( ! isset( $wpcom_rest_api_v2_plugins ) ) {
			$wpcom_rest_api_v2_plugins = array();
		}

		if ( ! isset( $wpcom_rest_api_v2_plugins[ $class_name ] ) ) {
			$wpcom_rest_api_v2_plugins[ $class_name ] = new $class_name();
		}
	}
}

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * A drop-in for a WordPress.com function.
	 *
	 * @param string $feature The name of the feature to check.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		/**
		 * Filters whether a site has a feature. Only used for testing purposes.
		 *
		 * @param bool   $has_feature Whether the site has the feature.
		 * @param string $feature     The name of the feature to check.
		 */
		return apply_filters( 'wpcom_site_has_feature_test', true, $feature );
	}
}

if ( ! function_exists( 'wpcom_feature_exists' ) ) {
	/**
	 * A drop-in for a WordPress.com function.
	 *
	 * @param string $feature The name of the feature to check.
	 * @return bool
	 */
	function wpcom_feature_exists( $feature ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// All features exist in the test environment.
		return true;
	}
}
