<?php
/**
 * Utility functions for WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * A wrapper for WordPress's `wp_unslash()`.
 *
 * Even though PHP itself dropped the option to add slashes to superglobals a decade ago,
 * WordPress still does it through some misguided extreme backwards compatibility. 🙄
 *
 * If WordPress's function exists, assume it needs to be called. If not, assume it doesn't.
 *
 * @param string|array $value String or array of data to unslash.
 * @return string|array Possibly unslashed $value.
 */
function wp_unslash( $value ) {
	if ( function_exists( '\\wp_unslash' ) ) {
		return \wp_unslash( $value );
	} else {
		return $value;
	}
}

/**
 * PHP helpfully parses request data into nested arrays in superglobals like $_GET and $_POST,
 * and as part of that parsing turns field names like "myfield[x][y]" into a nested array
 * that looks like [ "myfield" => [ "x" => [ "y" => "..." ] ] ]
 * However, modsecurity (and thus our WAF rules) expect the original (non-nested) names.
 *
 * Therefore, this method takes an array of any depth and returns a single-depth array with nested
 * keys translated back to a single string with brackets.
 *
 * Because there might be multiple items with the same name, this function will return an array of tuples,
 * with the first item in the tuple the re-created original field name, and the second item the value.
 *
 * @example
 * flatten_array( [ "field1" => "abc", "field2" => [ "d", "e", "f" ] ] )
 * => [
 *       [ "field1", "abc" ],
 *       [ "field2[0]", "d" ],
 *       [ "field2[1]", "e" ],
 *       [ "field2[2]", "f" ],
 * ]
 *
 * @param array     $array         An array that resembles one of the PHP superglobals like $_GET or $_POST.
 * @param string    $key_prefix    String that should be prepended to the keys output by this function.
 *                                 Usually only used internally as part of recursion when flattening a nested array.
 * @param bool|null $dot_notation  Whether to use dot notation instead of bracket notation.
 *
 * @return array{0: string, 1: scalar}[]  $key_prefix  An array of key/value tuples, one for each distinct value in the input array.
 */
function flatten_array( $array, $key_prefix = '', $dot_notation = null ) {
	$return = array();
	foreach ( $array as $source_key => $source_value ) {
		$key = $source_key;
		if ( ! empty( $key_prefix ) ) {
			$key = $dot_notation ? "$key_prefix.$source_key" : $key_prefix . "[$source_key]";
		}

		if ( ! is_array( $source_value ) ) {
			$return[] = array( $key, $source_value );
		} else {
			$return = array_merge( $return, flatten_array( $source_value, $key, $dot_notation ) );
		}
	}
	return $return;
}

/**
 * Polyfill for getallheaders, which is not available in all PHP environments.
 *
 * @link https://github.com/ralouphie/getallheaders
 */
if ( ! function_exists( 'getallheaders' ) ) {
	/**
	 * Get all HTTP header key/values as an associative array for the current request.
	 *
	 * @return array The HTTP header key/value pairs.
	 */
	function getallheaders() {
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput
		$headers = array();

		$copy_server = array(
			'CONTENT_TYPE'   => 'Content-Type',
			'CONTENT_LENGTH' => 'Content-Length',
			'CONTENT_MD5'    => 'Content-Md5',
		);

		foreach ( $_SERVER as $key => $value ) {
			if ( substr( $key, 0, 5 ) === 'HTTP_' ) {
				$key = substr( $key, 5 );
				if ( ! isset( $copy_server[ $key ] ) || ! isset( $_SERVER[ $key ] ) ) {
					$key             = str_replace( ' ', '-', ucwords( strtolower( str_replace( '_', ' ', $key ) ) ) );
					$headers[ $key ] = $value;
				}
			} elseif ( isset( $copy_server[ $key ] ) ) {
				$headers[ $copy_server[ $key ] ] = $value;
			}
		}

		if ( ! isset( $headers['Authorization'] ) ) {
			if ( isset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
				$headers['Authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
			} elseif ( isset( $_SERVER['PHP_AUTH_USER'] ) ) {
				$basic_pass               = $_SERVER['PHP_AUTH_PW'] ?? '';
				$headers['Authorization'] = 'Basic ' . base64_encode( $_SERVER['PHP_AUTH_USER'] . ':' . $basic_pass );
			} elseif ( isset( $_SERVER['PHP_AUTH_DIGEST'] ) ) {
				$headers['Authorization'] = $_SERVER['PHP_AUTH_DIGEST'];
			}
		}

		return $headers;
	}
}
