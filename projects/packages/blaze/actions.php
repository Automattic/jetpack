<?php
/**
 * Action Hooks for Jetpack Blaze package.
 *
 * Wires the Blaze Abilities API registrar. The registrar's `init()` is
 * gated behind the `jetpack_wp_abilities_enabled` filter (default false),
 * so this call is safe to make unconditionally and still opt-in per-site
 * until the flag is flipped.
 *
 * @package automattic/jetpack-blaze
 */

use Automattic\Jetpack\Blaze\Abilities\Blaze_Abilities;

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', array( Blaze_Abilities::class, 'init' ), 1 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( Blaze_Abilities::class, 'init' ),
	);
}
