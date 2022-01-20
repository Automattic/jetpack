<?php
/**
 * Search global definitions and operations.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

define( 'JETPACK_SEARCH_PKG__VERSION', '0.5.2-alpha' );
define( 'JETPACK_SEARCH_PKG__DIR', __DIR__ );
define( 'JETPACK_SEARCH_PKG__SLUG', 'jetpack-search-pkg' );

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

/**
 * Adds the package slug and version to the package version tracker's data.
 *
 * @param array $package_versions The package version array.
 *
 * @return array The packge version array.
 */
function pkg_send_version_to_tracker( $package_versions ) {
	$package_versions[ JETPACK_SEARCH_PKG__SLUG ] = JETPACK_SEARCH_PKG__VERSION;
	return $package_versions;
}

/**
 * Whether Jetpack Search's version maps to a public release, or a development version.
 */
function is_development_version() {
		/**
		 * Allows filtering whether this is a development version of Jetpack Search.
		 *
		 * This filter is especially useful for tests.
		 *
		 * @param bool $development_version Is this a develoment version of Jetpack?
		 */
		return (bool) apply_filters(
			'jetpack_search_pkg_development_version',
			! preg_match( '/^\d+(\.\d+)+$/', JETPACK_SEARCH_PKG__VERSION )
		);
}

// Set up package version hook.
$add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\pkg_send_version_to_tracker' );
