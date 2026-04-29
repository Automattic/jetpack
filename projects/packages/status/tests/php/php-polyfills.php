<?php
/**
 * Polyfills for PHP 8 string functions.
 *
 * A selection from `wp-includes/compat.php`, as some tests use these functions.
 *
 * @package automattic/jetpack-status
 */

// @todo: Remove this file once PHP 7.x support is dropped across the monorepo.
// @phan-file-suppress PhanRedefineFunctionInternal -- These are guarded polyfills.
if ( PHP_VERSION_ID >= 80000 ) {
	return;
}

if ( ! function_exists( 'str_contains' ) ) {
	/**
	 * Polyfill for `str_contains()` (PHP 8.0+).
	 *
	 * @param string $haystack The string to search in.
	 * @param string $needle   The substring to search for in the haystack.
	 * @return bool
	 */
	function str_contains( $haystack, $needle ) {
		if ( '' === $needle ) {
			return true;
		}
		return false !== strpos( $haystack, $needle );
	}
}

if ( ! function_exists( 'str_starts_with' ) ) {
	/**
	 * Polyfill for `str_starts_with()` (PHP 8.0+).
	 *
	 * @param string $haystack The string to search in.
	 * @param string $needle   The substring to search for at the start of the haystack.
	 * @return bool
	 */
	function str_starts_with( $haystack, $needle ) {
		if ( '' === $needle ) {
			return true;
		}
		return 0 === strpos( $haystack, $needle );
	}
}

if ( ! function_exists( 'str_ends_with' ) ) {
	/**
	 * Polyfill for `str_ends_with()` (PHP 8.0+).
	 *
	 * @param string $haystack The string to search in.
	 * @param string $needle   The substring to search for at the end of the haystack.
	 * @return bool
	 */
	function str_ends_with( $haystack, $needle ) {
		if ( '' === $haystack ) {
			return '' === $needle;
		}
		$len = strlen( $needle );
		return $len <= strlen( $haystack ) && 0 === substr_compare( $haystack, $needle, -$len );
	}
}
