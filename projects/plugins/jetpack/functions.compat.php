<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Compatibility functions for YouTube URLs and WP.com helper functions.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Post_Media\Shortcodes;

/**
 * Required for class.media-extractor.php to match expected function naming convention.
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Post_Media\Shortcodes::get_youtube_id() instead.
 *
 * @param string|array $url Can be just the $url or the whole $atts array.
 * @return bool|mixed The Youtube video ID via jetpack_get_youtube_id
 */
function jetpack_shortcode_get_youtube_id( $url ) {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Shortcodes::get_youtube_id' );
	return Shortcodes::get_youtube_id( $url );
}

/**
 * Extract video ID from a YouTube url.
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Post_Media\Shortcodes::get_youtube_id() instead.
 *
 * @param string|array $url YouTube URL.
 * @return bool|mixed The Youtube video ID
 */
function jetpack_get_youtube_id( $url ) {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Shortcodes::get_youtube_id' );
	return Shortcodes::get_youtube_id( $url );
}

if ( ! function_exists( 'jetpack_youtube_sanitize_url' ) ) :
	/**
	 * Normalizes a YouTube URL to include a v= parameter and a query string free of encoded ampersands.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Post_Media\Shortcodes::sanitize_youtube_url() instead.
	 *
	 * @param string|array $url YouTube URL.
	 * @return string|false The normalized URL or false if input is invalid.
	 */
	function jetpack_youtube_sanitize_url( $url ) {
		_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\Jetpack\Post_Media\Shortcodes::sanitize_youtube_url' );
		return Shortcodes::sanitize_youtube_url( $url );
	}
endif;

/**
 * Merge in three string helper functions from WPCOM to make working with strings easier.
 *
 * @see WPCOM/wp-content/mu-plugins/string-helpers.php
 */
if ( ! function_exists( 'wp_startswith' ) ) :
	/**
	 * Check whether a string starts with a specific substring.
	 *
	 * @param string $haystack String we are filtering.
	 * @param string $needle The substring we are looking for.
	 * @return bool
	 */
	function wp_startswith( $haystack, $needle ) {
		if ( ! $haystack || ! $needle || ! is_scalar( $haystack ) || ! is_scalar( $needle ) ) {
			return false;
		}

		$haystack = (string) $haystack;
		$needle   = (string) $needle;

		return str_starts_with( $haystack, $needle );
	}
endif;

if ( ! function_exists( 'wp_endswith' ) ) :
	/**
	 * Check whether a string ends with a specific substring.
	 *
	 * @param string $haystack String we are filtering.
	 * @param string $needle The substring we are looking for.
	 * @return bool
	 */
	function wp_endswith( $haystack, $needle ) {
		if ( ! $haystack || ! $needle || ! is_scalar( $haystack ) || ! is_scalar( $needle ) ) {
			return false;
		}

		$haystack = (string) $haystack;
		$needle   = (string) $needle;

		return str_ends_with( $haystack, $needle );
	}
endif;

if ( ! function_exists( 'wp_in' ) ) :
	/**
	 * Checks whether a string contains a specific substring.
	 *
	 * @param string $needle The substring we are looking for.
	 * @param string $haystack String we are filtering.
	 * @return bool
	 */
	function wp_in( $needle, $haystack ) {
		if ( ! $haystack || ! $needle || ! is_scalar( $haystack ) || ! is_scalar( $needle ) ) {
			return false;
		}

		$haystack = (string) $haystack;
		$needle   = (string) $needle;

		return str_contains( $haystack, $needle );
	}
endif;

/**
 * Deprecated connection function.
 *
 * @param string $text Deprecated.
 * @deprecated 7.5 Use Connection_Manager instead.
 */
function jetpack_sha1_base64( $text ) {
	$connection = new Connection_Manager();
	return $connection->sha1_base64( $text );
}
