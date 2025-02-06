<?php
/**
 * The installer manager class file.
 *
 * @package automattic/jetpack-composer-plugin
 */

namespace Automattic\Jetpack\Composer;

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
	 * @return string modified installation path.
	 */
	public function getInstallPath( PackageInterface $package ) {
		return 'jetpack_vendor/' . $package->getPrettyName();
	}

	/**
	 * Declares the supported package type by returning true whenever it meets a package
	 * that declares itself as a Jetpack library.
	 *
	 * @param string $package_type a package type string.
	 * @return boolean whether the package is supported.
	 */
	public function supports( $package_type ) {
		return 'jetpack-library' === $package_type;
	}
}
