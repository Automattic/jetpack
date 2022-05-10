<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search_Plugin;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Search\Module_Control as Search_Module_Control;
use Automattic\Jetpack\Search\Options as Search_Options;

/**
 * Class to bootstrap Jetpack Search Plugin
 *
 * @package automattic/jetpack-search
 */
class Jetpack_Search_Plugin {
	const ACTIVATION_OPTION_NAME = Search_Options::OPTION_PREFIX . 'plugin_is_activated';

	/**
	 * Register hooks to initialize the plugin
	 */
	public static function bootstrap() {
		add_action( 'plugins_loaded', array( self::class, 'ensure_dependencies_configured' ), 1 );
		add_action( 'plugins_loaded', array( self::class, 'initialize' ) );
		register_activation_hook( JETPACK_SEARCH_PLUGIN__FILE, array( self::class, 'handle_plugin_activation' ) );
		add_action( 'admin_init', array( self::class, 'redirect_on_activation' ) );
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

	/**
	 * Activation hook.
	 */
	public static function handle_plugin_activation() {
		// If site is already connected, enable the search module and enable instant search.
		if ( ( new Connection_Manager() )->is_connected() ) {
			$controller        = new Search_Module_Control();
			$activation_result = $controller->activate();

			if ( true === $activation_result ) {
				$controller->enable_instant_search();
			}
		}

		// Used for redirecting to the search dashboard following plugin activation.
		add_option( self::ACTIVATION_OPTION_NAME, true );
	}

	/**
	 * Runs after the plugin activation hook for page redirection.
	 */
	public static function redirect_on_activation() {
		if ( get_option( self::ACTIVATION_OPTION_NAME ) ) {
			delete_option( self::ACTIVATION_OPTION_NAME );
			wp_safe_redirect( admin_url( 'admin.php?page=jetpack-search' ) );
		}
	}
}
