<?php
/**
 * Functions that mock WordPress core functionality for testing purposes.
 *
 * @package automattic/jetpack-ip
 */

if ( ! function_exists( 'get_option' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * Note that the `$test_options` global can be used to set options to be returned via this function.
	 *
	 * @param string $option  Name of the option to retrieve. Expected to not be SQL-escaped.
	 * @param mixed  $default Default value to return if the option does not exist.
	 * @return mixed Value set for the option.
	 */
	function get_option( $option, $default = false ) {
		global $test_options;

		if ( isset( $test_options[ $option ] ) ) {
			return $test_options[ $option ];
		}

		return $default;
	}
}

if ( ! function_exists( 'get_site_option' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * Note that the `$test_options` global can be used to set options to be returned via this function.
	 *
	 * @param string $option  Name of the option to retrieve. Expected to not be SQL-escaped.
	 * @param mixed  $default Default value to return if the option does not exist.
	 * @return mixed Value set for the option.
	 */
	function get_site_option( $option, $default = false ) {
		return get_option( $option, $default );
	}
}

/**
 * Adds an option to be used in tests.
 *
 * @param string $option The option to set.
 * @param mixed  $value The value to set to the option.
 */
function add_test_option( $option, $value ) {
	global $test_options;
	$test_options[ $option ] = $value;
}

if ( ! function_exists( 'wp_unslash' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string|array $value String or array of data to unslash.
	 * @return string|array Unslashed `$value`.
	 */
	function wp_unslash( $value ) {
		return $value;
	}
}
