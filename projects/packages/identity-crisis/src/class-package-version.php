<?php
/**
 * The Package_Version class.
 *
 * @package automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack\IdentityCrisis;

/**
 * The Package_Version class.
 */
class Package_Version {

	const PACKAGE_VERSION = '0.18.0-alpha';

	const PACKAGE_SLUG = 'identity-crisis';

	/**
	 * Adds the package slug and version to the package version tracker's data.
	 *
	 * @param array $package_versions The package version array.
	 *
	 * @return array The package version array.
	 */
	public static function send_package_version_to_tracker( $package_versions ) {
		$package_versions[ self::PACKAGE_SLUG ] = self::PACKAGE_VERSION;

		return $package_versions;
	}
}
