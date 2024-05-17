<?php
/**
 * Functions that mock WordPress core functionality for testing purposes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'add_blog_option' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param int    $id     A blog ID. Can be null to refer to the current blog.
	 * @param string $option Name of option to add. Expected to not be SQL-escaped.
	 * @param mixed  $value  Optional. Option value, can be anything. Expected to not be SQL-escaped.
	 * @return bool True if the option was added, false otherwise.
	 */
	function add_blog_option( $id, $option, $value ) {
		$id = (int) $id;

		if ( empty( $id ) ) {
			$id = get_current_blog_id();
		}

		if ( get_current_blog_id() == $id ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			return add_option( $option, $value );
		}

		switch_to_blog( $id );
		$return = add_option( $option, $value );
		restore_current_blog();

		return $return;
	}
}

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
