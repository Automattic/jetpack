<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-boost
 */

// Suppress PHP 8.6 deprecation warnings from Patchwork.
// @todo: Remove this after the next patchwork release, which will include https://github.com/antecedent/patchwork/pull/227.
if ( PHP_VERSION_ID >= 80500 ) {
	set_error_handler(
		function ( $errno, $errstr, $errfile = '' ) {
			return E_DEPRECATED === $errno
				&& str_starts_with( $errstr, 'Calling ReflectionMethod::invokeArgs() for static method ' )
				&& str_ends_with( $errfile, 'vendor/antecedent/patchwork/src/CallRerouting.php' );
		},
		E_ALL
	);
}

// Load Patchwork for mocking built-in functions (must be loaded before autoloader).
require_once __DIR__ . '/../vendor/antecedent/patchwork/Patchwork.php';

// Set this to ensure we can load any files with a direct access check.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', true );
}

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../vendor/autoload.php';

// PHP 8.0 polyfill: WordPress core polyfills str_contains() at runtime (WP 5.9+),
// but the unit suite runs without WordPress, so PHP <= 7.4 needs it here for the
// production code paths under test that call it.
if ( ! function_exists( 'str_contains' ) ) {
	/**
	 * Polyfill for PHP 8.0's str_contains().
	 *
	 * @param string $haystack String to search in.
	 * @param string $needle   Substring to search for.
	 * @return bool Whether $haystack contains $needle.
	 * @suppress PhanRedefineFunctionInternal -- Guarded polyfill for PHP < 8.0.
	 */
	function str_contains( $haystack, $needle ) {
		return '' === $needle || false !== strpos( $haystack, $needle );
	}
}

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

// Additional mocks.
require_once __DIR__ . '/php/mocks/class-wp-speculation-rules.php';
