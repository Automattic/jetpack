<?php
/**
 * Action Hooks for Jetpack Helper Script module.
 *
 * @package automattic/jetpack-helper-script
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_filter' ) ) {
	$add_filter = 'add_filter';
	$add_action = 'add_action';
} else {
	$add_filter = function ( $name, $cb, $priority = 10, $accepted_args = 1 ) {
		global $wp_filter;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_filter[ $name ][ $priority ][] = array(
			'accepted_args' => $accepted_args,
			'function'      => $cb,
		);
	};
	$add_action = $add_filter;
}

// Clean up expired Jetpack Helper Scripts from a scheduled event.
$add_action( 'jetpack_cleanup_helper_scripts', array( 'Automattic\\Jetpack\\Helper_Script\\Helper_Script_Manager', 'cleanup_expired_helper_scripts' ) );

// Register REST routes.
$add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Helper_Script\\REST_Controller', 'register_rest_routes' ) );

// Set up package version hook.
$add_filter( 'jetpack_package_versions', 'Automattic\\Jetpack\\Helper_Script\\Package_Version::send_package_version_to_tracker' );
