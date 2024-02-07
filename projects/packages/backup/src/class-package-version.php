<?php
/**
 * The Package_Version class.
 *
 * @package automattic/jetpack-backup
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
// phpcs:disable Universal.Namespaces.OneDeclarationPerFile.MultipleFound

namespace Automattic\Jetpack\Backup;

// Might be already initialized if we're upgrading.
if ( ! class_exists( '\Automattic\Jetpack\Backup\Package_Version' ) ) {
	/**
	 * The Package_Version class.
	 *
	 * Does *not* use namespaced versioning ("VXXXX") because send_package_version_to_tracker() is used as a
	 * "jetpack_package_versions" filter, and said filter gets run during a plugin upgrade, so it always expects to
	 * find the "Package_Version" class with the same namespace, name, and interface.
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
}

namespace Automattic\Jetpack\Backup\V0001;

// Might be already initialized if we're upgrading.
if ( ! class_exists( '\Automattic\Jetpack\Backup\V0001\Package_Version' ) ) {

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
}
