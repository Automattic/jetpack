<?php

/**
 * WordPress Custom Autoloader Generator.
 *
 * @package   WordPress\ComposerAutoload
 * @author    Alain Schlesser <alain.schlesser@gmail.com>
 * @license   MIT
 * @link      https://www.alainschlesser.com/
 * @copyright 2016 Alain Schlesser
 *
 * Partially based on xrstf/composer-php52 by Christoph Mewes.
 * @see       https://github.com/composer-php52/composer-php52
 */

namespace Jetpack\Autoloader;

use Composer\Script\Event;

/**
 * Class Generator.
 *
 * Listen to the PostInstallCmd Event to dump an additional WordPress-specific autoloader.
 *
 * @since   1.0.0
 *
 * @package WordPress\ComposerAutoload
 * @author  Alain Schlesser <alain.schlesser@gmail.com>
 */
class Generator {

	public static function dump( Event $event ) {

		$composer            = $event->getComposer();
		$installationManager = $composer->getInstallationManager();
		$repoManager         = $composer->getRepositoryManager();
		$localRepo           = $repoManager->getLocalRepository();
		$package             = $composer->getPackage();
		$config              = $composer->getConfig();

		$optimize = true; // Always optimize for now. // $args  = $_SERVER['argv'];  in_array( '-o', $args ) || in_array( '--optimize-autoloader', $args ) || in_array( '--optimize', $args );

		$suffix = $config->get( 'autoloader-suffix' );

		$generator = new AutoloadGenerator( $event->getIO() );
		$generator->dump( $config, $localRepo, $package, $installationManager, 'composer', $optimize, $suffix );
	}
}
