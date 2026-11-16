<?php
/**
 * Bootstrap of the Jetpack Announcements package.
 *
 * @package automattic/jetpack-announcements
 */

// The registration helper, defined before any registrant runs.
require_once __DIR__ . '/src/functions.php';

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

// Register REST routes.
$add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Announcements\\REST_Controller', 'register_rest_routes' ) );

// Register the script module of the What's new surface.
$add_action( 'admin_init', array( 'Automattic\\Jetpack\\Announcements\\Announcements', 'register_script_module' ) );
