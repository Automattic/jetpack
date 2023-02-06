<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-status
 */

/**
 * Includes the Composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Additional functions that brain/monkey doesn't currently define.
if ( ! function_exists( 'wp_unslash' ) ) {
	/**
	 * Workalike for WordPress's `wp_unslash`.
	 *
	 * @param string|array $value Value to unslash.
	 * @return string|array Unslashed value.
	 */
	function wp_unslash( $value ) {
		if ( is_array( $value ) ) {
			return array_map( 'wp_unslash', $value );
		} elseif ( is_object( $value ) ) {
			// Overwrites values in $value, but that's what WP core's own function does too.
			foreach ( $value as $k => $v ) {
				$value->$k = wp_unslash( $v );
			}
			return $value;
		} elseif ( is_string( $value ) ) {
			return stripslashes( $value );
		} else {
			return $value;
		}
	}
}
