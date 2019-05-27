<?php
// phpcs:ignoreFile -- this is not a core file
namespace Jetpack\Autoloader;

use Composer\Composer;
use Composer\IO\IOInterface;
use Composer\Script\Event;
use Composer\Script\ScriptEvents;
use Composer\Plugin\PluginInterface;
use Composer\EventDispatcher\EventSubscriberInterface;

class CustomAutoloaderPlugin implements PluginInterface, EventSubscriberInterface {

	/**
	 * Do nothing.
	 *
	 * @param Composer    $composer
	 * @param IOInterface $io
	 */
	public function activate( Composer $composer, IOInterface $io ) {
		// do nothing yet
	}

	/**
	 * Tell composer to listen for events and do something with them.
	 *
	 * @return array
	 */
	public static function getSubscribedEvents() {
		return array(
			ScriptEvents::POST_UPDATE_CMD    => 'postAutoloadDump',
			ScriptEvents::POST_INSTALL_CMD   => 'postAutoloadDump',
			ScriptEvents::POST_AUTOLOAD_DUMP => 'postAutoloadDump',
		);
	}

	/**
	 * Generate the custom autolaoder.
	 *
	 * @param Event $event
	 */
	public static function postAutoloadDump( Event $event ) {

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
