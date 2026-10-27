<?php
/**
 * Bootstrap class for the Jetpack Stats plugin.
 *
 * @package automattic/jetpack-stats-plugin
 */

namespace Automattic\Jetpack\Stats_Plugin;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Paths;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;
use Automattic\Jetpack\PremiumAnalytics\Enablement;
use Automattic\Jetpack\PremiumAnalytics\Enablement_Setting;
use Automattic\Jetpack\Stats_Admin\Admin_Bar as Stats_Admin_Bar;
use Automattic\Jetpack\Stats_Admin\Admin_Post_List_Column;
use Automattic\Jetpack\Stats_Admin\Dashboard as Stats_Dashboard;
use Automattic\Jetpack\Stats_Admin\WP_Dashboard_Odyssey_Widget;
use Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard;

/**
 * Class to bootstrap the Jetpack Stats plugin.
 */
class Jetpack_Stats_Plugin {
	/**
	 * The admin page slug registered by the Stats dashboard.
	 *
	 * Owned by `Automattic\Jetpack\Stats_Admin\Dashboard`, which registers a top-level
	 * menu with this slug. Kept here so the plugin can link to the page.
	 */
	const ADMIN_PAGE_SLUG = 'stats';

	/**
	 * Register hooks to initialize the plugin.
	 */
	public static function bootstrap() {
		if ( class_exists( Classic_Stats::class ) ) {
			Classic_Stats::register_feature_flag();
		}

		add_action( 'plugins_loaded', array( self::class, 'configure_packages' ), 1 );
		add_action( 'plugins_loaded', array( self::class, 'initialize_other_packages' ) );
		add_action( 'activated_plugin', array( self::class, 'handle_plugin_activation' ) );
		add_action( 'jetpack_site_registered', array( self::class, 'activate_stats_module' ) );
		add_filter( 'plugin_action_links_' . JETPACK_STATS_PLUGIN__FILE_RELATIVE_PATH, array( self::class, 'plugin_page_add_links' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( self::class, 'filter_available_modules_add_stats' ) );

		/**
		 * The Jetpack plugin owns the Stats admin menu while it is active, and it chooses
		 * between the legacy Stats screen and the Odyssey dashboard. Once it is deactivated
		 * that choice falls to this plugin, so re-activate the module and take over the menu.
		 */
		add_action( 'deactivate_jetpack/jetpack.php', array( self::class, 'activate_stats_module' ) );
	}

	/**
	 * Configure packages controlled by the `Config` class, and boot Stats v2.
	 *
	 * `Config` initializes its packages on 'plugins_loaded' priority 2, hence priority 1 here.
	 * Stats v2 is the exception and boots right away; see `Analytics::init()` for why.
	 */
	public static function configure_packages() {
		$config = new Config();
		// Connection package.
		$config->ensure(
			'connection',
			array(
				'slug'     => JETPACK_STATS_PLUGIN__SLUG,
				'name'     => 'Jetpack Stats',
				'url_info' => 'https://jetpack.com/stats/',
			)
		);
		// Sync package.
		$config->ensure( 'sync' );
		// Identity crisis package.
		$config->ensure( 'identity_crisis' );
		// Stats package: the tracking pixel, the `view_stats` capability map and the REST provider.
		$config->ensure( 'stats' );
		// Stats Admin package: the REST proxy to the WPCOM stats API used by the dashboard.
		$config->ensure( 'stats_admin' );

		// Another plugin may have loaded an older package without the shared rule.
		if ( ! self::is_jetpack_plugin_active() && class_exists( Enablement::class ) && Enablement::is_enabled() ) {
			Analytics::init();
			Analytics_Dashboard::init();
		}
	}

	/**
	 * Initialize packages not controlled by the `Config` class.
	 */
	public static function initialize_other_packages() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();
		// Initialize My Jetpack.
		My_Jetpack_Initializer::init();

		/**
		 * Three places can register the `stats` menu slug, and only one of them may run.
		 * `Stats_Admin\Main` registers the dashboard itself while the site has no connection,
		 * and the Jetpack plugin registers it from `modules/stats.php` once the Stats module
		 * loads. That leaves the connected site without the Jetpack plugin to this plugin.
		 * The Jetpack plugin also adds the admin bar chart, the Posts column and the dashboard widget.
		 */
		if ( self::is_jetpack_plugin_active() ) {
			return;
		}

		// Registered while Stats v2 is off too: it is the setting that turns it on.
		add_action( 'rest_api_init', array( Enablement_Setting::class, 'register' ), 0 );

		if ( ( new Connection_Manager() )->is_connected() ) {
			// Once Stats v2 takes over, old `page=stats` links open it instead.
			if ( ! method_exists( Analytics::class, 'is_initialized' ) || ! Analytics::is_initialized() || ! Classic_Stats::is_retired() ) {
				Stats_Dashboard::init();
			}
			if ( ( new Modules() )->is_active( 'stats' ) ) {
				Stats_Admin_Bar::init();
				Admin_Post_List_Column::register();
			}
			add_action( 'wp_dashboard_setup', array( WP_Dashboard_Odyssey_Widget::class, 'register_widget' ) );
		}
	}

	/**
	 * Whether the full Jetpack plugin is running alongside this one.
	 *
	 * @return bool
	 */
	public static function is_jetpack_plugin_active() {
		return class_exists( 'Jetpack' );
	}

	/**
	 * Add a Stats link to the plugin actions.
	 *
	 * @param array $links the array of links.
	 * @return array
	 */
	public static function plugin_page_add_links( $links ) {
		/** This filter is documented in projects/packages/stats-admin/src/class-admin-bar.php */
		$stats_url  = apply_filters( 'jetpack_stats_url', admin_url( 'admin.php?page=' . self::ADMIN_PAGE_SLUG ), array( 'view' => 'dashboard' ) );
		$stats_link = '<a href="' . esc_url( $stats_url ) . '">' . esc_html__( 'Stats', 'jetpack-stats' ) . '</a>';
		array_unshift( $links, $stats_link );

		return $links;
	}

	/**
	 * Redirect to the Stats dashboard when the plugin is activated.
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 */
	public static function handle_plugin_activation( $plugin ) {
		// `activated_plugin` fires for every plugin, so ignore everything but this one.
		// Otherwise activating an unrelated plugin turns Stats back on after a user disabled it.
		if ( JETPACK_STATS_PLUGIN__FILE_RELATIVE_PATH !== $plugin ) {
			return;
		}

		// On a connected site the module can be switched on right away. On a site with no
		// connection this is a no-op.
		self::activate_stats_module();

		// `page=stats` opens in both connection states, as the classic page or as Stats v2 once
		// that retires it. Without a connection the dashboard offers a plan and drives the
		// connection itself.
		if ( ( new Paths() )->is_current_request_activating_plugin_from_plugins_screen( JETPACK_STATS_PLUGIN__FILE_RELATIVE_PATH ) ) {
			wp_safe_redirect( esc_url( admin_url( 'admin.php?page=' . self::ADMIN_PAGE_SLUG ) ) );
			exit( 0 );
		}
	}

	/**
	 * Activate the Stats module on a connected site.
	 *
	 * @return bool True when the module is active after the call, false when the site has no
	 *              connection or the module could not be activated.
	 */
	public static function activate_stats_module() {
		if ( ! ( new Connection_Manager() )->is_connected() ) {
			return false;
		}

		return (bool) ( new Modules() )->activate( 'stats', false, false );
	}

	/**
	 * Add the Stats module to the list of modules available without the Jetpack plugin.
	 *
	 * @param array $modules The available modules.
	 * @return array
	 */
	public static function filter_available_modules_add_stats( $modules ) {
		return array_merge( array( 'stats' ), $modules );
	}
}
