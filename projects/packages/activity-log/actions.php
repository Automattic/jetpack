<?php
/**
 * Action Hooks for the Jetpack Activity Log package.
 *
 * @package automattic/jetpack-activity-log
 */

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_filter' ) ) {
	$add_filter = 'add_filter';
} else {
	$add_filter = function ( $name, $cb, $priority = 10, $accepted_args = 1 ) {
		global $wp_filter;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_filter[ $name ][ $priority ][] = array(
			'accepted_args' => $accepted_args,
			'function'      => $cb,
		);
	};
}

// Set up package version hook.
$add_filter( 'jetpack_package_versions', 'Automattic\\Jetpack\\Activity_Log\\Package_Version::send_package_version_to_tracker' );
