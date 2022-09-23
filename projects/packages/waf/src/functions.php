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
