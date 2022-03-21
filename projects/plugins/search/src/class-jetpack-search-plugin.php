<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search_Plugin;

use Automattic\Jetpack\Config;

/**
 * Class to bootstrap Jetpack Search Plugin
 *
 * @package automattic/jetpack-search
 */
class Jetpack_Search_Plugin {
	/**
	 * Intialize Jetpack Search plugin
	 */
	public static function initiallize() {
		add_action( 'plugins_loaded', array( self::class, 'ensure_dependencies_configured' ), 1 );
	}

	/**
	 * Ensure plugin dependencies are configured.
	 */
	public static function ensure_dependencies_configured() {
		$config = new Config();
		// Connection package.
		$config->ensure(
			'connection',
			array(
				'slug'     => JETPACK_SEARCH_PLUGIN__SLUG,
				'name'     => 'Jetpack Search',
				'url_info' => 'https://jetpack.com/upgrade/search/',
			)
		);
		// Sync package.
		$config->ensure( 'sync' );
		// Identity crisis package.
		$config->ensure( 'identity_crisis' );
		// Search package.
		$config->ensure( 'search' );
	}
}
