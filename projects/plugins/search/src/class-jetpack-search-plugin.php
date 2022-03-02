<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

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
		add_action( 'plugins_loaded', array( self::class, 'ensure_dependecies_configured' ), 1 );
	}

	/**
	 * Ensure jetpack packages depended are configured.
	 */
	public function ensure_dependecies_configured() {
		$config = new Config();
		// Connection package.
		$config->ensure(
			'connection',
			array(
				'slug'     => JETPACK_SEARCH_PLUGIN__SLUG,
				'name'     => 'Jetpack Search',
				'url_info' => 'https://jetpack.com',
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
