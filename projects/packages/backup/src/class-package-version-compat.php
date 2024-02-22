<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The Package_Version class's compatibility shim.
 *
 * @package automattic/jetpack-backup
 */

// Do *not* update the "V0001" namespace version on changes.
namespace Automattic\Jetpack\Backup\V0001;

/**
 * Package_Version proxy class to accommodate upgrades from plugin version 2.4.
 *
 * Backup plugin version 2.4 had a versioned class defined ("Automattic\Jetpack\Backup\V0001\Package_Version"), so
 * the "jetpack_package_versions" filter will try to look for the class with this namespace + name in the newer
 * plugin's code.
 */
class Package_Version {
	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public static function send_package_version_to_tracker( $package_versions ) {
		return \Automattic\Jetpack\Backup\Package_Version::send_package_version_to_tracker( $package_versions );
	}
}
