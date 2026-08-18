<?php
/**
 * Utility functions for device detection.
 *
 * @package automattic/jetpack-device-detection
 */

namespace Automattic\Jetpack\Device_Detection;

// Check if the function is already defined, in case someone bypassed the autoloader or something
// to get the two classes from different copies of the package.
if ( ! function_exists( __NAMESPACE__ . '\\wp_unslash' ) ) {

	/**
	 * A wrapper for WordPress's `wp_unslash()`.
	 *
	 * Even though PHP itself dropped the option to add slashes to superglobals a decade ago,
	 * WordPress still does it through some misguided extreme backwards compatibility. 🙄
	 *
	 * If WordPress's function exists, assume it needs to be called.
	 * Else if on WordPress.com, do a simplified version because we're running really early.
	 * Else, assume it's not needed.
	 *
	 * @param string $value String of data to unslash.
	 * @return string Possibly unslashed $value.
	 */
	function wp_unslash( $value ) {
		if ( function_exists( '\\wp_unslash' ) ) {
			return \wp_unslash( $value );
		} elseif ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return stripslashes( $value );
		} else {
			return $value;
		}
	}
}

// Check if the function is already defined, in case someone bypassed the autoloader or something
// to get the two classes from different copies of the package.
if ( ! function_exists( __NAMESPACE__ . '\\sanitize_text_field' ) ) {

	/**
	 * A wrapper for WordPress's `sanitize_text_field()`.
	 *
	 * On WordPress.com this package is loaded before WordPress itself, so the core function
	 * cannot be relied on. The fallback follows core closely enough that detection does not
	 * change with load order. It leaves out core's invalid-UTF-8 check, and it drops an
	 * unterminated tag where core would entity-encode it; neither affects the substring
	 * matching this value is used for.
	 *
	 * @param string $value String of data to sanitize.
	 * @return string Sanitized $value.
	 */
	function sanitize_text_field( $value ) {
		if ( function_exists( '\\sanitize_text_field' ) ) {
			return \sanitize_text_field( $value );
		}

		// Script and style contents go first, the way wp_strip_all_tags() does it. Plain
		// strip_tags() would keep the text between the tags.
		$filtered = preg_replace( '@<(script|style)[^>]*?>.*?</\\1>@si', '', (string) $value );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.strip_tags_strip_tags -- This branch only runs when WordPress is absent, so wp_strip_all_tags() does not exist.
		$filtered = strip_tags( $filtered );
		$filtered = trim( preg_replace( '/[\r\n\t ]+/', ' ', $filtered ) );

		$found = false;
		while ( preg_match( '/%[a-f0-9]{2}/i', $filtered, $match ) ) {
			$filtered = str_replace( $match[0], '', $filtered );
			$found    = true;
		}

		if ( $found ) {
			$filtered = trim( preg_replace( '/ +/', ' ', $filtered ) );
		}

		return $filtered;
	}
}
