<?php
/**
 * Compatibility for Revolution Slider
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Revslider;

/**
 * Exclude Revolution Slider scripts from deferred JS.
 * We can't use handles, since revslider doesn't have a standardized naming convention.
 *
 * @param array $scripts The scripts to exclude.
 * @return array The scripts to exclude.
 */
function exclude_revslider_scripts( $scripts ) {
	// Don't check scripts if Revolution Slider isn't active.
	if ( ! class_exists( '\RevSliderFront' ) ) {
		return $scripts;
	}

	// Filter out any revslider scripts
	$scripts = array_filter(
		$scripts,
		function ( $script ) {
			// Check if it's a script tag and contains revslider
			if ( is_array( $script ) && isset( $script[0] ) && strpos( $script[0], '<script' ) !== false ) {
				return strpos( $script[0], '/revslider/' ) === false;
			}
			return true;
		}
	);

	return array_values( $scripts );
}

add_filter( 'jetpack_boost_render_blocking_js_exclude_scripts', __NAMESPACE__ . '\exclude_revslider_scripts', 10, 1 );
