<?php
/**
 * Search global definitions and operations.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_filter' ) ) {
	$add_filter = 'add_filter';
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	$add_action = $add_filter;
}

// Set up package version hook.
$add_filter( 'jetpack_package_versions', array( Package::class, 'send_version_to_tracker' ) );
