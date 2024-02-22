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
