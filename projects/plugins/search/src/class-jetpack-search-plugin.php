<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search_Plugin;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;

/**
 * Class to bootstrap Jetpack Search Plugin
 *
 * @package automattic/jetpack-search
 */
class Jetpack_Search_Plugin {
	/**
	 * Register hooks to initialize the plugin
	 */
	public static function bootstrap() {
		add_action( 'plugins_loaded', array( self::class, 'ensure_dependencies_configured' ), 1 );
		add_action( 'plugins_loaded', array( self::class, 'initialize' ) );
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

	/**
	 * Initialize the plugin
	 */
	public static function initialize() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();
		// Initialize My Jetpack.
		My_Jetpack_Initializer::init();
	}
}
