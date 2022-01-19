<?php
/**
 * The Package_Version class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * The Package_Version class.
 */
class Package {

	const VERSION = '0.5.2-alpha';

	const SLUG = 'jetpack-search-pkg';

	/**
	 * Adds the package slug and version to the package version tracker's data.
	 *
	 * @param array $package_versions The package version array.
	 *
	 * @return array The packge version array.
	 */
	public static function send_package_version_to_tracker( $package_versions ) {
		$package_versions[ self::PACKAGE_SLUG ] = self::PACKAGE_VERSION;
		return $package_versions;
	}
}
