<?php
/**
 * Composer 304-short-circuiting plugin.
 *
 * This simple composer plugin redirects repo.packagist.org metadata URLs
 * to a proxy that will respond with a 304 response when it has already seen
 * the URL.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Composer304Plugin;

use Composer\Composer;
use Composer\EventDispatcher\EventSubscriberInterface;
use Composer\IO\IOInterface;
use Composer\Plugin\PluginEvents;
use Composer\Plugin\PluginInterface;
use Composer\Plugin\PreFileDownloadEvent;

/**
 * Composer plugin.
 */
class Plugin implements PluginInterface, EventSubscriberInterface {

	/**
	 * Composer IOInterface
	 *
	 * @var IOInterface
	 */
	private $io;

	/**
	 * Cert file path.
	 *
	 * @var string
	 */
	private $certfile;

	/**
	 * Apply plugin modifications to Composer
	 *
	 * @param Composer    $composer Composer.
	 * @param IOInterface $io IOInterface.
	 */
	public function activate( Composer $composer, IOInterface $io ) {
		$this->io       = $io;
		$this->certfile = getenv( 'JP_304_PLUGIN_CERT' );
	}

	/**
	 * Remove any hooks from Composer
	 *
	 * @param Composer    $composer Composer.
	 * @param IOInterface $io IOInterface.
	 */
	public function deactivate( Composer $composer, IOInterface $io ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}

	/**
	 * Prepare the plugin to be uninstalled
	 *
	 * This will be called after deactivate.
	 *
	 * @param Composer    $composer Composer.
	 * @param IOInterface $io IOInterface.
	 */
	public function uninstall( Composer $composer, IOInterface $io ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}

	/**
	 * Tell composer to listen for events and do something with them.
	 *
	 * @return array List of subscribed events.
	 */
	public static function getSubscribedEvents() {
		return array(
			PluginEvents::PRE_FILE_DOWNLOAD => 'onPreFileDownload',
		);
	}

	/**
	 * Pre-file-download event handler.
	 *
	 * Detects a metadata request and redirects the URL.
	 *
	 * @param PreFileDownloadEvent $event Event.
	 */
	public function onPreFileDownload( PreFileDownloadEvent $event ) {
		if ( $event->getType() !== 'metadata' ) {
			return;
		}

		$url = $event->getProcessedUrl();
		if ( substr( $url, 0, 27 ) === 'https://repo.packagist.org/' ) {
			$newurl = 'https://localhost:3129/' . substr( $url, 27 );
			$this->io->writeError( "Short-circuiting $url to $newurl", true, IOInterface::DEBUG );
			$event->setProcessedUrl( $newurl );

			if ( $this->certfile ) {
				$opts                  = $event->getTransportOptions();
				$opts['ssl']['cafile'] = $this->certfile;
				$event->setTransportOptions( $opts );
			}
		}
	}
}
