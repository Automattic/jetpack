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

use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Config as Jetpack_Config;
use Automattic\Jetpack\Image_CDN\Image_CDN_Core;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Plugin_Deactivation\Deactivation_Handler;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Data_Sync\Getting_Started_Entry;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\CLI;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Pages;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Setup;
use Automattic\Jetpack_Boost\Lib\Site_Health;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Lib\Super_Cache_Tracking;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Cache_Preload;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\REST_API\Endpoints\List_Cornerstone_Pages;
use Automattic\Jetpack_Boost\REST_API\Endpoints\List_LCP_Analysis;
use Automattic\Jetpack_Boost\REST_API\Endpoints\List_Site_Urls;
use Automattic\Jetpack_Boost\REST_API\Endpoints\List_Source_Providers;
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
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_Boost {

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @var string The string used to uniquely identify this plugin.
	 */
	private $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @var string The current version of the plugin.
	 */
	private $version;

	/**
	 * The Jetpack Boost Connection manager instance.
	 *
	 * @since    1.0.0
	 * @access   public
	 * @var Connection The Jetpack Boost Connection manager instance.
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
		$this->connection->init();

		$this->register_deactivation_hook();

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			$cli_instance = new CLI( $this );
			\WP_CLI::add_command( 'jetpack-boost', $cli_instance );
		}

		$modules_setup = new Modules_Setup();
		Setup::add( $modules_setup );

		$cornerstone_pages = new Cornerstone_Pages();
		Setup::add( $cornerstone_pages );

		// Initialize the Admin experience.
		$this->init_admin( $modules_setup );

		// Initiate jetpack sync.
		$this->init_sync();

		add_action( 'admin_init', array( $this, 'schedule_version_change' ) );

		add_action( 'init', array( $this, 'init_textdomain' ) );
		add_action( 'init', array( $this, 'setup_cron_schedules' ) );

		add_action( 'jetpack_boost_environment_changed', array( $this, 'handle_environment_change' ), 10, 2 );

		add_action( 'jetpack_boost_handle_version_change_cron', array( $this, 'handle_version_change' ) );

		// Fired when plugin ready.
		do_action( 'jetpack_boost_loaded', $this );

		My_Jetpack_Initializer::init();

		Deactivation_Handler::init( $this->plugin_name, __DIR__ . '/admin/deactivation-dialog.php' );

		// Register the core Image CDN hooks.
		Image_CDN_Core::setup();

		// Setup Site Health panel functionality.
		Site_Health::init();

		Super_Cache_Tracking::setup();
	}

	/**
	 * Register deactivation hook.
	 */
	private function register_deactivation_hook() {
		$plugin_file = trailingslashit( dirname( __DIR__ ) ) . 'jetpack-boost.php';
		register_deactivation_hook( $plugin_file, array( $this, 'deactivate' ) );
	}

	public function schedule_version_change() {
		$version = get_option( 'jetpack_boost_version' );

		if ( $version === JETPACK_BOOST_VERSION ) {
			return;
		}
		update_option( 'jetpack_boost_version', JETPACK_BOOST_VERSION );

		// Schedule the cron event to handle the version change. This ensures the previous version's handle is always flushed.
		if ( ! wp_next_scheduled( 'jetpack_boost_handle_version_change_cron' ) ) {
			wp_schedule_single_event( time() + 2, 'jetpack_boost_handle_version_change_cron' );
		}
	}

	public function handle_version_change() {
		// Remove this option to prevent the notice from showing up.
		delete_site_option( 'jetpack_boost_static_minification' );

		// Add upgrade check for Cornerstone Pages.
		$pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );
		if ( is_array( $pages ) && in_array( home_url( '' ), $pages, true ) ) {
			// Remove homepage (empty string) from the cornerstone pages list.
			$pages = array_filter(
				$pages,
				function ( $page ) {
					return $page !== home_url( '' );
				}
			);
			jetpack_boost_ds_set( 'cornerstone_pages_list', $pages );
		}

		if ( jetpack_boost_minify_is_enabled() ) {
			// We need to clear Minify scheduled events to ensure the latest scheduled jobs are only scheduled irrespective of scheduled arguments.
			jetpack_boost_minify_clear_scheduled_events();
			jetpack_boost_minify_activation();
		}

		$page_cache = new Module( new Page_Cache() );
		if ( $page_cache->is_enabled() ) {
			// Schedule the cronjob to preload the cache for Cornerstone Pages.
			( new Cache_Preload() )->schedule_cornerstone_cronjob();
		}
	}

	/**
	 * Adds the custom cron intervals to the schedules list.
	 */
	public function setup_cron_schedules() {
		add_filter( 'cron_schedules', array( $this, 'custom_cron_intervals' ) );
	}

	/**
	 * Adds custom cron intervals used by Boost.
	 *
	 * @param array $schedules The existing cron schedules.
	 * @return array The modified cron schedules.
	 *
	 * @since 3.12.0
	 */
	public function custom_cron_intervals( $schedules ) {
		// The "twicehourly" name maintains the same pattern as the default "twicedaily" name.
		if ( ! isset( $schedules['twicehourly'] ) ) {
			$schedules['twicehourly'] = array(
				'interval' => 30 * MINUTE_IN_SECONDS,
				'display'  => __( 'Twice Hourly', 'jetpack-boost' ),
			);
		}
		return $schedules;
	}

	/**
	 * Add query args used by Boost to a list of allowed query args.
	 *
	 * @param array $allowed_query_args The list of allowed query args.
	 *
	 * @return array The modified list of allowed query args.
	 */
	public static function whitelist_query_args( $allowed_query_args ) {
		$allowed_query_args[] = Generator::GENERATE_QUERY_ACTION;
		$allowed_query_args[] = Module::DISABLE_MODULE_QUERY_VAR;
		return $allowed_query_args;
	}

	/**
	 * Plugin activation handler.
	 */
	public static function activate() {
		// Make sure user sees the "Get Started" when first time opening.
		( new Getting_Started_Entry() )->set( true );
		Analytics::record_user_event( 'activate_plugin' );

		$page_cache_status = new Status( Page_Cache::get_slug() );
		if ( $page_cache_status->get() && Boost_Cache_Settings::get_instance()->get_enabled() ) {
			Page_Cache_Setup::run_setup();
		}

		$modules_setup = new Modules_Setup();

		/*
		 * Check what modules are already active (from a previous activation for example).
		 * If there are active modules, we need to ensure each module-related event is triggered again.
		 */
		$active_modules = $modules_setup->get_status();
		if (
			! empty( $active_modules )
			&& ( new Connection() )->is_connected()
		) {
			foreach ( $active_modules as $module => $status ) {
				$modules_setup->on_module_status_update( $module, true );
			}
		}
	}

	/**
	 * Plugin deactivation handler. Clear cache, and reset admin notices.
	 */
	public function deactivate() {
		do_action( 'jetpack_boost_deactivate' );

		// Tell Minify JS/CSS to clean up.
		jetpack_boost_page_optimize_deactivate();

		Regenerate_Admin_Notice::dismiss();
		Analytics::record_user_event( 'deactivate_plugin' );
		Page_Cache_Setup::deactivate();

		// Clean up Image Size Analysis data.
		$this->cleanup_image_size_analysis_data();
	}

	/**
	 * Clean up Image Size Analysis data from the database.
	 *
	 * @since 4.3.0
	 */
	private function cleanup_image_size_analysis_data() {
		global $wpdb;

		// Delete all post meta entries for Image Size Analysis fixes.
		//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete(
			$wpdb->postmeta,
			array( 'meta_key' => '_jb_image_fixes' ),
			array( '%s' )
		);
	}

	/**
	 * Initialize the admin experience.
	 */
	public function init_admin( $modules_setup ) {
		REST_API::register( List_Site_Urls::class );
		REST_API::register( List_Source_Providers::class );
		REST_API::register( List_Cornerstone_Pages::class );
		REST_API::register( List_LCP_Analysis::class );

		$this->connection->ensure_connection();
		( new Admin() )->init( $modules_setup );
	}

	public function init_sync() {
		$jetpack_config = new Jetpack_Config();
		$jetpack_config->ensure(
			'sync',
			array(
				'jetpack_sync_callable_whitelist' => array(
					'boost_modules'                => array( new Modules_Setup(), 'get_status' ),
					'boost_sub_modules_state'      => array( new Modules_Setup(), 'get_all_sub_modules_state' ),
					'boost_latest_scores'          => array( new Speed_Score_History( get_home_url() ), 'latest' ),
					'boost_latest_no_boost_scores' => array( new Speed_Score_History( add_query_arg( Module::DISABLE_MODULE_QUERY_VAR, 'all', get_home_url() ) ), 'latest' ),
					'critical_css_state'           => array( new Critical_CSS_State(), 'get' ),
					'lcp_state'                    => array( new LCP_State(), 'get' ),
				),
			)
		);
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
	 * @return string The name of the plugin.
	 * @since     1.0.0
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @return string The version number of the plugin.
	 * @since     1.0.0
	 */
	public function get_version() {
		return $this->version;
	}

	/**
	 * Handle an environment change to set the correct status to the Critical CSS request.
	 * This is done here so even if the Critical CSS module is switched off we can
	 * still capture the change of environment event and flag Critical CSS for a rebuild.
	 */
	public function handle_environment_change( $is_major_change, $change_type ) {
		if ( $is_major_change ) {
			Regenerate_Admin_Notice::enable();
		}

		jetpack_boost_ds_set( 'critical_css_suggest_regenerate', $change_type );
	}

	/**
	 * Plugin uninstallation handler. Delete all settings and cache.
	 */
	public function uninstall() {
		global $wpdb;

		// When uninstalling, make sure all deactivation cleanups have run as well.
		$this->deactivate();

		// Delete all Jetpack Boost options.
		//phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$option_names = $wpdb->get_col(
			"
				SELECT `option_name`
				FROM   `$wpdb->options`
				WHERE  `option_name` LIKE 'jetpack_boost_%';
			"
		);
		//phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		foreach ( $option_names as $option_name ) {
			delete_option( $option_name );
		}

		// Delete the last run options for the network-wide cron jobs.
		delete_site_option( 'jetpack_boost_404_tester_last_run' );
		delete_site_option( 'jetpack_boost_minify_cron_cache_cleanup_last_run' );

		// Delete stored Critical CSS.
		( new Critical_CSS_Storage() )->clear();

		// Delete all transients created by boost.
		Transient::delete_bulk();

		// Clear getting started value
		( new Getting_Started_Entry() )->set( false );

		Page_Cache_Setup::uninstall();
	}
}
