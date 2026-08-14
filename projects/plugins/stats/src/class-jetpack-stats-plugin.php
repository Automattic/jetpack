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
use Automattic\Jetpack\Stats_Admin\Dashboard as Stats_Dashboard;

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
	 * My Jetpack's admin page slug.
	 *
	 * Landing on this page with no connection makes My Jetpack redirect to its own
	 * onboarding step. See `My_Jetpack\Initializer::get_onboarding_redirect_args()`.
	 */
	const MY_JETPACK_PAGE_SLUG = 'my-jetpack';

	/**
	 * Register hooks to initialize the plugin.
	 */
	public static function bootstrap() {
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
		 * `Config::ensure( 'stats_admin' )` starts the package but does not register the
		 * dashboard page — the Jetpack plugin does that itself in `modules/stats.php`.
		 * Register it here only when the Jetpack plugin is absent, so the two never
		 * register the same `stats` menu slug.
		 */
		if ( self::is_jetpack_plugin_active() ) {
			return;
		}

		// Every figure in the dashboard is read back from the WordPress.com API, which
		// needs a connection token.
		if ( ( new Connection_Manager() )->is_connected() ) {
			Stats_Dashboard::init();
		} else {
			add_action( 'admin_menu', array( self::class, 'register_disconnected_menu' ), 999 );
		}
	}

	/**
	 * Register a Stats menu that routes to the connection flow.
	 *
	 * Runs at priority 999 to match `Stats_Admin\Dashboard`, which places itself between
	 * the Jetpack plugin (998) and Admin_Menu (1000).
	 */
	public static function register_disconnected_menu() {
		$page_suffix = add_menu_page(
			__( 'Stats', 'jetpack-stats' ),
			_x( 'Stats', 'product name shown in menu', 'jetpack-stats' ),
			'view_stats',
			self::ADMIN_PAGE_SLUG,
			'__return_null',
			'dashicons-chart-bar',
			2
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( self::class, 'redirect_to_connection_flow' ) );
		}
	}

	/**
	 * Send the current request to My Jetpack, which redirects on to its onboarding step.
	 *
	 * @return never
	 */
	public static function redirect_to_connection_flow() {
		wp_safe_redirect( admin_url( 'admin.php?page=' . self::MY_JETPACK_PAGE_SLUG ) );
		exit( 0 );
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
		$stats_link = '<a href="' . esc_url( admin_url( 'admin.php?page=' . self::ADMIN_PAGE_SLUG ) ) . '">' . esc_html__( 'Stats', 'jetpack-stats' ) . '</a>';
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

		// The stand-in menu forwards an unconnected site on to My Jetpack onboarding, so this
		// redirect does not branch on the connection state.
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
