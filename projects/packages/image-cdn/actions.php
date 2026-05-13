<?php
/**
 * Action Hooks for the Jetpack Image CDN package.
 *
 * Registers the package's WP Abilities surface from `plugins_loaded`.
 * `Image_CDN_Abilities::init()` is gated internally by the
 * `jetpack_wp_abilities_enabled` filter (default false), so it is safe
 * to call unconditionally from every consumer of this package
 * (Jetpack plugin's Photon module, Boost, etc.).
 *
 * @package automattic/jetpack-image-cdn
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', array( Automattic\Jetpack\Image_CDN\Abilities\Image_CDN_Abilities::class, 'init' ), 1 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Image_CDN\Abilities\Image_CDN_Abilities::class, 'init' ),
	);
}
