<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost;

use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\CLI;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\Speed_Score_History;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Modules\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Render_Blocking_JS\Render_Blocking_JS;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @author     Automattic <support@jetpack.com>
 */
class Jetpack_Boost {

	const AVAILABLE_MODULES = array(
		Critical_CSS::MODULE_SLUG       => Critical_CSS::class,
		Lazy_Images::MODULE_SLUG        => Lazy_Images::class,
		Render_Blocking_JS::MODULE_SLUG => Render_Blocking_JS::class,
	);

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @var      string $plugin_name The string used to uniquely identify this plugin.
	 */
	private $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @var      string $version The current version of the plugin.
	 */
	private $version;

	/**
	 * Store all plugin module instances here
	 *
	 * @var Module[]
	 */
	private $modules = array();

	/**
	 * The Jetpack Boost Connection manager instance.
	 *
	 * @since    1.0.0
	 * @access   public
	 * @var      Connection $connection The Jetpack Boost Connection manager instance.
	 */
	public $connection;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		$this->version     = JETPACK_BOOST_VERSION;
		$this->plugin_name = 'jetpack-boost';

		$this->connection = new Connection();

		// Require plugin features.
		$this->init_textdomain();

		$this->register_deactivation_hook();

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			$cli_instance = new CLI( $this );
			\WP_CLI::add_command( 'jetpack-boost', $cli_instance );
		}

		$this->modules = $this->prepare_modules();

		// Initialize the Admin experience.
		$this->init_admin();

		// Module readiness filter.
		add_action( 'wp_head', array( $this, 'display_meta_field_module_ready' ) );

		add_action( 'init', array( $this, 'initialize_modules' ) );
		add_action( 'init', array( $this, 'init_textdomain' ) );
		add_action( 'init', array( $this, 'register_cache_clear_actions' ) );

		add_action( 'handle_theme_change', array( $this, 'handle_theme_change' ) );

		// Fired when plugin ready.
		do_action( 'jetpack_boost_loaded', $this );
	}

	/**
	 * Register deactivation hook.
	 */
	private function register_deactivation_hook() {
		$plugin_file = trailingslashit( dirname( __DIR__ ) ) . 'jetpack-boost.php';
		register_deactivation_hook( $plugin_file, array( $this, 'deactivate' ) );
	}

	/**
	 * Wipe all cached values.
	 */
	public function clear_cache() {
		do_action( 'jetpack_boost_clear_cache' );
	}

	/**
	 * Plugin deactivation handler. Clear cache, and reset admin notices.
	 */
	public function deactivate() {
		do_action( 'jetpack_boost_deactivate' );

		$this->clear_cache();
		Admin::clear_dismissed_notices();
	}

	/**
	 * Plugin uninstallation handler. Delete all settings and cache.
	 */
	public function uninstall() {
		do_action( 'jetpack_boost_uninstall' );

		Speed_Score_History::clear_all();
		$this->clear_cache();

	}

	/**
	 * Handlers for clearing module caches go here, so that caches get cleared even if the module is not enabled.
	 */
	public function register_cache_clear_actions() {
		add_action( 'jetpack_boost_clear_cache', array( $this, 'record_clear_cache_event' ) );
	}

	/**
	 * Record the clear cache event.
	 */
	public function record_clear_cache_event() {
		Analytics::record_user_event( 'clear_cache' );
	}

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public function prepare_modules() {

		$forced_disabled_modules = array();
		$modules                 = array();

		// Get the lists of modules explicitly disabled from the 'jb-disable-modules' query string.
		// The parameter is a comma separated value list of module slug.
		if ( ! empty( $_GET['jb-disable-modules'] ) ) {
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$forced_disabled_modules = array_map( 'sanitize_key', explode( ',', $_GET['jb-disable-modules'] ) );
		}

		foreach ( self::AVAILABLE_MODULES as $module_slug => $module_class ) {
			// Don't register modules that have been forcibly disabled from the url 'jb-disable-modules' query string parameter.
			if ( in_array( $module_slug, $forced_disabled_modules, true ) || in_array( 'all', $forced_disabled_modules, true ) ) {
				continue;
			}

			/**
			 * @var Module $module
			 */
			$module = new $module_class();
			$toggleable_module                  = new Module( $module );
			$modules[ $module_slug ] = $toggleable_module;

			if ( $module instanceof Has_Endpoints ) {
				$module_routes = $module->get_endpoints();
			}

			if ( ! empty( $module_routes ) ) {
				$rest_api = new REST_API( $module_routes );
				add_action( 'rest_api_init', array( $rest_api, 'register_rest_routes' ) );
			}
		}


		do_action( 'jetpack_boost_modules_loaded' );
		return $modules;
	}

	/**
	 * Initialize modules when WordPress is ready
	 */
	public function initialize_modules() {
		foreach ( $this->modules as $module ) {
			if ( $module->is_enabled() ) {
				$module->initialize();
			}
		}
	}

	/**
	 * Returns the list of available modules.
	 *
	 * @return array The available modules.
	 */
	public static function get_available_modules() {
		return array_keys( self::AVAILABLE_MODULES );
	}

	/**
	 * Returns an array of active modules.
	 */
	public function get_active_modules() {
		return array_filter( $this->modules, function( $module ) {
			return $module->is_enabled();
		} );
	}

	/**
	 * @param string $module_slug
	 *
	 * @return Module|false
	 */
	public function get_module( $module_slug ) {
		if ( ! $this->modules[ $module_slug ] ) {
			return false; // @TODO: Return empty module instead
		}

		return $this->modules[ $module_slug ];
	}

	/**
	 * Initialize the admin experience.
	 */
	public function init_admin() {
		$this->connection->ensure_connection();
		new Admin( $this );
	}

	/**
	 * Loads the textdomain.
	 */
	public function init_textdomain() {
		load_plugin_textdomain(
			'jetpack-boost',
			false,
			JETPACK_BOOST_DIR_PATH . '/languages/'
		);
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @return    string    The name of the plugin.
	 * @since     1.0.0
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @return    string    The version number of the plugin.
	 * @since     1.0.0
	 */
	public function get_version() {
		return $this->version;
	}

	/**
	 * Returns a list of admin notices to show. Asks each module to provide admin notices the user needs to see.
	 *
	 * @return \Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
		// @TODO
		return array();
		$all_notices = array();

		foreach ( $this->get_active_modules() as $module ) {
			$module_notices = $module->get_admin_notices();

			if ( ! empty( $module_notices ) ) {
				$all_notices = array_merge( $all_notices, $module_notices );
			}
		}

		return $all_notices;
	}

	/**
	 * Handle an environment change to set the correct status to the Critical CSS request.
	 * This is done here so even if the Critical CSS module is switched off we can
	 * still capture the change of environment event and flag Critical CSS for a rebuild.
	 */
	public function handle_theme_change() {
		Admin::clear_dismissed_notice( Regenerate_Admin_Notice::SLUG );
		\update_option( Critical_CSS::RESET_REASON_STORAGE_KEY, Regenerate_Admin_Notice::REASON_THEME_CHANGE, false );
	}
}
