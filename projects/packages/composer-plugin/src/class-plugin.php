<?php
/**
 * Main class file for the Composer plugin that will implement a custom installer for Jetpack
 * packages.
 *
 * @see https://getcomposer.org/doc/articles/custom-installers.md
 * @package automattic/jetpack-composer-plugin
 * */

namespace Automattic\Jetpack\Composer;

use Composer\Composer;
use Composer\IO\IOInterface;
use Composer\Plugin\PluginInterface;

/**
 * This class is the entry point for the installer plugin. The Composer
 * installation mechanism registers the plugin by calling its activate method.
 */
class Plugin implements PluginInterface {

	/**
	 * Activates the installer plugin at installation time.
	 *
	 * @param Composer    $composer the Composer global instance.
	 * @param IOInterface $io the IO interface global instance.
	 */
	public function activate( Composer $composer, IOInterface $io ) {
		$installer = new Manager( $io, $composer );
		$composer->getInstallationManager()->addInstaller( $installer );
	}

	/**
	 * Deactivates the installer plugin.
	 */
	public function deactivate() {
		// TODO: implement.
	}

	/**
	 * Uninstalls the installer plugin.
	 */
	public function uninstall() {
		// TODO: implement.
	}
}
