<?php
/**
 * Action Hooks for Jetpack Activity Log package.
 *
 * @package automattic/jetpack-activity-log
 */

use Automattic\Jetpack\Activity_Log\Abilities\Activity_Log_Abilities;

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	$add_action = 'add_action';
} else {
	$add_action = function ( $name, $cb, $priority = 10, $accepted_args = 1 ) {
		global $wp_filter;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_filter[ $name ][ $priority ][] = array(
			'accepted_args' => $accepted_args,
			'function'      => $cb,
		);
	};
}

// Register Activity Log abilities (WordPress Abilities API, WP 6.9+).
// Gated behind the `jetpack_wp_abilities_enabled` filter (defaults to
// false) inside Registrar::init(), so this call is safe to make
// unconditionally and stays opt-in per-site until the flag is flipped.
$add_action( 'plugins_loaded', array( Activity_Log_Abilities::class, 'init' ) );
