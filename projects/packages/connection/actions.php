<?php
/**
 * Action Hooks for Jetpack connection assets.
 *
 * @package automattic/jetpack-connection
 */

if ( function_exists( 'is_admin' ) && ! is_admin() ) {
	// Only initialize the assets in the admin area, or if we aren't quite sure about it.
	return;
}

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action(
		'plugins_loaded',
		array( Automattic\Jetpack\Connection\Connection_Assets::class, 'configure' ),
		1
	);
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Connection\Connection_Assets::class, 'configure' ),
	);
}
