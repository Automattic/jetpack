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
	 * Installer instance.
	 *
	 * @var Manager|null
	 */
	private $installer;

	/**
	 * Activates the installer plugin at installation time.
	 *
	 * @param Composer    $composer the Composer global instance.
	 * @param IOInterface $io the IO interface global instance.
	 */
	public function activate( Composer $composer, IOInterface $io ) {
		$this->installer = new Manager( $io, $composer );
		$composer->getInstallationManager()->addInstaller( $this->installer );
	}

	/**
	 * Deactivates the installer plugin.
	 *
	 * @param Composer    $composer the Composer global instance.
	 * @param IOInterface $io the IO interface global instance.
	 */
	public function deactivate( Composer $composer, IOInterface $io ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$composer->getInstallationManager()->removeInstaller( $this->installer );
	}

	/**
	 * Uninstalls the installer plugin.
	 *
	 * @param Composer    $composer the Composer global instance.
	 * @param IOInterface $io the IO interface global instance.
	 */
	public function uninstall( Composer $composer, IOInterface $io ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}
}
