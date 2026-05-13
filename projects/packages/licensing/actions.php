<?php
/**
 * Action Hooks for Jetpack Licensing package.
 *
 * Registers the package's WordPress Abilities API surface as soon as the
 * plugin API is available. The Registrar base class is itself gated on the
 * `jetpack_wp_abilities_enabled` filter (default false), so this only takes
 * effect on sites that have opted in to the staged Abilities rollout.
 *
 * @package automattic/jetpack-licensing
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action(
		'plugins_loaded',
		array( Automattic\Jetpack\Licensing\Abilities\Licensing_Abilities::class, 'init' ),
		1
	);
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Automattic\Jetpack\Licensing\Abilities\Licensing_Abilities::class, 'init' ),
	);
}
