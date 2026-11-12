<?php
/**
 * Action Hooks for the Jetpack Announcements package.
 *
 * @package automattic/jetpack-announcements
 */

// The registration helper, defined before any registrant runs.
require_once __DIR__ . '/src/functions.php';

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_action' ) ) {
	add_action( 'rest_api_init', array( Automattic\Jetpack\Announcements\REST_Controller::class, 'register_rest_routes' ) );
} else {
	global $wp_filter;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$wp_filter['rest_api_init'][10][] = array(
		'accepted_args' => 1,
		'function'      => array( Automattic\Jetpack\Announcements\REST_Controller::class, 'register_rest_routes' ),
	);
}
