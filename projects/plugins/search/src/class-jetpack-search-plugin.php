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
use Automattic\Jetpack\Modules;
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
		add_action( 'jetpack_site_registered', array( self::class, 'activate_stats_module_on_site_registered' ) );
		/**
		 * In case the Jetpack plugin is deactivated, make sure to re-activate the Stats module, as the
		 * module toggle, available in the Jetpack plugin no longer needs to be respected.
		 *
		 * @todo Consider removing this action if a Stats module toggle is implemented in the Jetpack Search Plugin.
		 */
		add_action( 'deactivate_jetpack/jetpack.php', array( self::class, 'activate_stats_module_on_deactivate_jetpack' ) );
		add_filter( 'plugin_action_links_' . JETPACK_SEARCH_PLUGIN__FILE_RELATIVE_PATH, array( self::class, 'plugin_page_add_links' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( self::class, 'filter_available_modules_add_stats' ), 10, 1 );
	}

	/**
	 * Add settings and My Jetpack links to plugin actions
	 *
	 * @param array $links the array of links.
	 */
	public static function plugin_page_add_links( $links ) {
		$settings_link = '<a href="' . admin_url( 'admin.php?page=jetpack-search' ) . '">' . esc_html__( 'Settings', 'jetpack-search' ) . '</a>';
		array_unshift( $links, $settings_link );

		return $links;
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
		// Stats package.
		$config->ensure( 'stats' );
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
		// If site is already connected, enable the search and stats modules and enable instant search.
		if ( ( new Connection_Manager() )->is_connected() ) {
			$controller        = new Search_Module_Control();
			$activation_result = $controller->activate();

			if ( true === $activation_result ) {
				$controller->enable_instant_search();
			}
			( new Modules() )->activate( 'stats', false, false );
		}

		if (
			JETPACK_SEARCH_PLUGIN__FILE_RELATIVE_PATH === $plugin &&
			\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_SEARCH_PLUGIN__FILE_RELATIVE_PATH )
		) {
			wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-search' ) ) );
			exit;
		}
	}

	/**
	 * Adds stats module to the list of available modules.
	 *
	 * @param array $modules The available modules.
	 * @return array
	 */
	public static function filter_available_modules_add_stats( $modules ) {
		return array_merge( array( 'stats' ), $modules );
	}

	/**
	 * Fires on the `jetpack_site_registered` action and activates stats module.
	 */
	public static function activate_stats_module_on_site_registered() {
		( new Modules() )->activate( 'stats', false, false );
	}

	/**
	 * Fires on the `deactivate_jetpack` action and activates stats module.
	 *
	 * @todo Consider removing this action if a Stats module toggle is implemented in the Jetpack Search Plugin.
	 */
	public static function activate_stats_module_on_deactivate_jetpack() {
		( new Modules() )->activate( 'stats', false, false );
	}
}
