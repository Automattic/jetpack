<?php
/**
 * Action Hooks for the Jetpack Plans package.
 *
 * Wires the package-level Abilities API registration. Loaded by the Composer
 * autoloader's `files` entry (see `composer.json`), so every consumer plugin
 * (Jetpack, Boost, Social, Search, ...) picks up the registration once the
 * package is loaded, without each consumer having to call `::init()` itself.
 *
 * The Registrar's `jetpack_wp_abilities_enabled` filter still gates whether
 * the lifecycle hooks actually fire, so this autoloaded call is cheap when
 * the rollout filter returns false.
 *
 * @package automattic/jetpack-plans
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', array( Automattic\Jetpack\Plans\Abilities\Plans_Abilities::class, 'init' ), 1 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Plans\Abilities\Plans_Abilities::class, 'init' ),
	);
}
