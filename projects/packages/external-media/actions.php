<?php
/**
 * Action Hooks for Jetpack External Media package.
 *
 * Registers the External Media abilities with the WordPress Abilities API.
 * Registration is gated by `jetpack_wp_abilities_enabled` (default false)
 * inside `Registrar::init()` — this file only schedules the call.
 *
 * @package automattic/jetpack-external-media
 */

use Automattic\Jetpack\External_Media\Abilities\External_Media_Abilities;

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'plugins_loaded', array( External_Media_Abilities::class, 'init' ), 1 );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['plugins_loaded'][1][] = array(
		'accepted_args' => 0,
		'function'      => array( External_Media_Abilities::class, 'init' ),
	);
}
