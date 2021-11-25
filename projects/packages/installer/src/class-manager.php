<?php
/**
 * The installer manager class file.
 *
 * @package automattic/jetpack-installer
 */

namespace Automattic\Jetpack\Installer;

use Composer\Installer\LibraryInstaller;
use Composer\Package\PackageInterface;

/**
 * The manager class that is the main agent for the installer plugin.
 * It handles the installation process by accepting the installed package
 * and modifying its installation path.
 * */
class Manager extends LibraryInstaller {

	/**
	 * Receives a supported package instance and modifies its installation path.
	 *
	 * @param PackageInterface $package the installed package object.
	 * @throws \InvalidArgumentException $exception When the package is not the expected type.
	 * @return String modified installation path.
	 */
	public function getInstallPath( PackageInterface $package ) {
		$prefix = substr( $package->getPrettyName(), 0, 19 );
		if ( 'automattic/jetpack-' !== $prefix ) {
			throw new \InvalidArgumentException(
				'Unable to install package: the Jetpack installer '
				. 'plugin only supports packages from the Jetpack monorepo '
				. '"automattic/jetpack-"'
			);
		}

		return 'jetpack_vendor/' . $package->getPrettyName();
	}

	/**
	 * Declares the supported package type by returning true whenever it meets a package
	 * that declares itself as a Jetpack library.
	 *
	 * @param String $package_type a package type string.
	 * @return Boolean whether the package is supported.
	 */
	public function supports( $package_type ) {
		return 'jetpack-library' === $package_type;
	}
}
