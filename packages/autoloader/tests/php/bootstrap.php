<?php
/**
 * Bootstrap file for the autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

if ( ! function_exists( 'trailingslashit' ) ) {

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param String $string string.
	 * @return String
	 */
	function trailingslashit( $string ) {
		return rtrim( $string, '/\\' ) . '/';
	}
}

if ( ! function_exists( 'wp_unslash' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string|string[] $value String or array of strings to unslash.
	 * @return string|string[] Unslashed $value
	 */
	function wp_unslash( $value ) {
		return stripslashes_deep( $value );
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed $value The value to be stripped.
	 * @return mixed Stripped value.
	 */
	function stripslashes_deep( $value ) {
		return map_deep( $value, 'stripslashes_from_strings_only' );
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed    $value    The array, object, or scalar.
	 * @param callable $callback The function to map onto $value.
	 * @return mixed The value with the callback applied to all non-arrays and non-objects inside it.
	 */
	function map_deep( $value, $callback ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $index => $item ) {
				$value[ $index ] = map_deep( $item, $callback );
			}
		} elseif ( is_object( $value ) ) {
			$object_vars = get_object_vars( $value );
			foreach ( $object_vars as $property_name => $property_value ) {
				$value->$property_name = map_deep( $property_value, $callback );
			}
		} else {
			$value = call_user_func( $callback, $value );
		}

		return $value;
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed $value The array or string to be stripped.
	 * @return mixed $value The stripped value.
	 */
	function stripslashes_from_strings_only( $value ) {
		return is_string( $value ) ? stripslashes( $value ) : $value;
	}
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/functions.php';
require_once __DIR__ . '/../../src/class-plugins-handler.php';
require_once __DIR__ . '/../../src/class-classes-handler.php';
require_once __DIR__ . '/../../src/class-files-handler.php';
require_once __DIR__ . '/../../src/class-version-selector.php';
