<?php
/**
 * Action Hooks for Jetpack Assets module.
 *
 * @package automattic/jetpack-assets
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
// Anything hooked on plugins_loaded here must also be re-run from
// Assets::ensure_package_bootstrap(), or an older sibling copy silently skips it. JETPACK-2649.
if ( function_exists( 'add_action' ) ) {
	add_action( 'wp_default_scripts', array( Automattic\Jetpack\Assets::class, 'wp_default_scripts_hook' ) );
	add_action( 'plugins_loaded', array( Automattic\Jetpack\Assets\Script_Data::class, 'configure' ), 1 );
	add_action( 'plugins_loaded', array( Automattic\Jetpack\Assets\Shared_Stores_Assets::class, 'configure' ), 1 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['wp_default_scripts'][10][] = array(
		'accepted_args' => 1,
		'function'      => array( Automattic\Jetpack\Assets::class, 'wp_default_scripts_hook' ),
	);
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Assets\Script_Data::class, 'configure' ),
	);
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Assets\Shared_Stores_Assets::class, 'configure' ),
	);
}
