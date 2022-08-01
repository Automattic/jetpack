<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-search-plugin
 */

namespace Automattic\Jetpack\Search_Plugin;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Search\Module_Control as Search_Module_Control;

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
		add_action( 'plugins_loaded', array( self::class, 'load_compatibility_files' ), 1 );
		add_action( 'plugins_loaded', array( self::class, 'configure_packages' ), 1 );
		add_action( 'plugins_loaded', array( self::class, 'initialize_other_packages' ) );
		add_action( 'activated_plugin', array( self::class, 'handle_plugin_activation' ) );
	}

	/**
	 * Extra tweaks to make Jetpack Search play well with others.
	 */
	public static function load_compatibility_files() {
		if ( class_exists( 'Jetpack' ) ) {
			require_once JETPACK_SEARCH_PLUGIN__DIR . '/compatibility/jetpack.php';
		}
	}

	/**
	 * Configure packages controlled by the `Config` class.
	 *
	 * Note: the function only configures the packages, but doesn't initialize them.
	 * The actual initialization is done on 'plugins_loaded' priority 2, which is the
	 * reason the function is hooked on priority 1.
	 */
	public static function configure_packages() {
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
	 * Initialize packages not controlled by the `Config` class.
	 */
	public static function initialize_other_packages() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();
		// Initialize My Jetpack.
		My_Jetpack_Initializer::init();
	}

	/**
	 * Redirects to the Search Dashboard when the Search plugin is activated.
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 */
	public static function handle_plugin_activation( $plugin ) {
		// If site is already connected, enable the search module and enable instant search.
		if ( ( new Connection_Manager() )->is_connected() ) {
			$controller        = new Search_Module_Control();
			$activation_result = $controller->activate();

			if ( true === $activation_result ) {
				$controller->enable_instant_search();
			}
		}

		// Redirect to the Search Dashboard only when Jetpack plugin is not activated.
		if ( JETPACK_SEARCH_PLUGIN__FILE_RELATIVE_PATH === $plugin && ! class_exists( 'Jetpack' ) ) {
			wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-search' ) ) );
			exit;
		}
	}
}
