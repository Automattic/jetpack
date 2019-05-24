<?php

/**
 * Custom Autoloader Generator
 * Responsible for creating the custom autoloader (autoload_packages.php)
 * that is required as well as the specific autoload_classmap_packages.php which contains the map of vendor classes.
 *
 * These hooks needs to be added to your project's (WordPress plugin or theme) composer.json file.
 * "scripts": {
	"post-install-cmd": [ "Jetpack\\Autoload\\Generator::dump" ],
	"post-update-cmd": [ "Jetpack\\Autoload\\Generator::dump" ],
	"post-autoload-dump": [ "Jetpack\\Autoload\\Generator::dump" ]
	}
 */

namespace Jetpack\Autoloader;

use Composer\Script\Event;

/**
 * Class Generator.
 *
 * Listen to the PostInstallCmd Event to generate a custom WordPress-specific autoloader.
 */
class Generator {

	public static function dump( Event $event ) {

		$composer            = $event->getComposer();
		$installationManager = $composer->getInstallationManager();
		$repoManager         = $composer->getRepositoryManager();
		$localRepo           = $repoManager->getLocalRepository();
		$package             = $composer->getPackage();
		$config              = $composer->getConfig();

		$generator = new AutoloadGenerator( $event->getIO() );

		$optimize = true;

		$generator->dump( $config, $localRepo, $package, $installationManager, 'composer', $optimize );
	}
}
