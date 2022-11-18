<?php
/**
 * Utility functions for device detection.
 *
 * @package automattic/jetpack-device-detection
 */

namespace Automattic\Jetpack\Device_Detection;

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
