<?php
/**
 * The Package_Version class.
 *
 * @package automattic/jetpack-backup
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
// phpcs:disable Universal.Namespaces.OneDeclarationPerFile.MultipleFound

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0002;

/**
 * The Package_Version class.
 *
 * Used as a "jetpack_package_versions" filter, so whenever you bump the old "VXXXX" version number to a new "VYYYY"
 * version, make sure to add a proxy class with the old "VXXXX" version number that would point to a new "VYYYY"
 * version of the class, otherwise upgrades will attempt to load the old "VXXX" version of the class and fail to do so.
 */
class Package_Version {

	const PACKAGE_VERSION = '3.1.3-alpha';

	const PACKAGE_SLUG = 'backup';

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

namespace Automattic\Jetpack\Backup;

/**
 * Filter namespace + class for upgrades from pre-2.4 versions of the plugin.
 */
class Package_Version {
	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function send_package_version_to_tracker( $package_versions ) {
		return V0002\Package_Version::send_package_version_to_tracker( $package_versions );
	}
}

namespace Automattic\Jetpack\Backup\V0001;

/**
 * Filter namespace + class for upgrades from version 2.4 of the plugin.
 */
class Package_Version {
	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function send_package_version_to_tracker( $package_versions ) {
		return \Automattic\Jetpack\Backup\V0002\Package_Version::send_package_version_to_tracker( $package_versions );
	}
}
