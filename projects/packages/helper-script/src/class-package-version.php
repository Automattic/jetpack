<?php
/**
 * The Package_Version class.
 *
 * @package automattic/jetpack-helper-script
 */

namespace Automattic\Jetpack\Helper_Script;

/**
 * The Package_Version class.
 */
class Package_Version {

	const PACKAGE_VERSION = '1.0.0-alpha';

	const PACKAGE_SLUG = 'helper-script';

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
