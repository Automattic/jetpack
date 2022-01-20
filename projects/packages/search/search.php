<?php
/**
 * The Package_Version class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;

/**
 * Location of built Jetpack Search assets, does not include trailing slash.
 */
define( 'JETPACK_SEARCH_PKG__VERSION', '0.5.2-alpha' );
define( 'JETPACK_SEARCH_PKG__DIR', __DIR__ );
define( 'JETPACK_SEARCH_PKG__SLUG', 'jetpack-search-pkg' );

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
			! preg_match( '/^\d+(\.\d+)+$/', Constants::get_constant( 'JETPACK_SEARCH_PKG__VERSION' ) )
		);
}
