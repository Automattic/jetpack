<?php
/**
 * Analytics package main class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Export;
use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use Automattic\Jetpack\PremiumAnalytics\REST\Notices_Controller;
use Automattic\Jetpack\PremiumAnalytics\Sync\Configuration as Sync_Configuration;
use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Main Analytics class.
 *
 * Loads the wp-build output and registers an admin page.
 * The build interceptor handles full-page rendering via admin_init.
 */
class Analytics {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Menu title for the admin page.
	 *
	 * @var string
	 */
	private static $menu_title = 'Analytics';

	/**
	 * Initialize the Analytics app on a connected Jetpack site.
	 *
	 * Registers the full local surface: the site serves the WPCOM data proxy,
	 * notices, sync bootstrap, and the dashboard support routes itself.
	 *
	 * @param array $options Optional configuration options.
	 *                       Supported keys:
	 *                       - menu_title (string): Admin menu label.
	 * @return void
	 */
	public static function init( $options = array() ) {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		self::apply_options( $options );

		self::register_sync_bootstrap();
		self::register_local_api();

		// Piggybacks on the Jetpack Stats module; checks Jetpack connection state.
		Jetpack_Stats_Tracker::configure();

		self::boot_shared_services();
		self::register_dashboard_support_routes();
		self::load_build();
		self::register_admin_page();
	}

	/**
	 * Initialize the Analytics app on WordPress.com Simple.
	 *
	 * Simple reaches public-api.wordpress.com directly via WPCOM's apiFetch
	 * bridge, so it registers no local REST surface: no proxy, notices, sync
	 * bootstrap, or dashboard support routes. WPCOM registers those separately.
	 *
	 * @param array $options Optional configuration options.
	 *                       Supported keys:
	 *                       - menu_title (string): Admin menu label.
	 * @return void
	 */
	public static function init_wpcom_simple( $options = array() ) {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		self::apply_options( $options );

		self::boot_shared_services();
		self::load_build();
		self::register_admin_page();
	}

	/**
	 * Apply init-time configuration options.
	 *
	 * @param array $options Options passed to the init entry points.
	 * @return void
	 */
	private static function apply_options( $options ) {
		if ( ! empty( $options['menu_title'] ) ) {
			self::$menu_title = $options['menu_title'];
		}
	}

	/**
	 * Boot the services and registries every platform needs, regardless of
	 * whether the site serves the dashboard support routes itself.
	 *
	 * @return void
	 */
	private static function boot_shared_services() {
		// Emit WooCommerce store events into the Woo pipeline (ClickHouse + proxy).
		WooCommerce_Analytics_Tracker::configure();

		// CSV report export pipeline (WOOA7S-1581): hooks rest_api_init, so it must
		// register on all requests. Self-gates on WooCommerce + Jetpack connection.
		Export::configure();

		self::load_dashboard_components();
	}

	/**
	 * Register the sync services that feed the local data pipeline.
	 *
	 * @return void
	 */
	private static function register_sync_bootstrap() {
		// Keep the shared connection available when another connection-owning plugin is deactivated.
		Connection_Configuration::configure();

		Sync_Status_Tracker::configure();

		// TEMPORARY (WOOA7S-1550): register the interim woocommerce_analytics sync module so
		// Sync_Status_Tracker has a full sync to observe. Remove when the shared sync-modules package lands.
		Sync_Configuration::register();
	}

	/**
	 * Register the site-served REST API: the WPCOM data proxy and notices.
	 *
	 * Both self-gate on their own rest_api_init hooks.
	 *
	 * @return void
	 */
	private static function register_local_api() {
		Api_Proxy_Controller::register();
		Notices_Controller::register();
	}

	/**
	 * Load the dashboard components every platform renders with.
	 *
	 * @return void
	 */
	private static function load_dashboard_components() {
		// Widget modules for the client's dynamic import() map.
		require_once __DIR__ . '/widget-modules.php';

		// Default layout's first-load preference injection.
		require_once __DIR__ . '/dashboard-layout.php';

		// Dashboard sections and their default layout seeding.
		require_once __DIR__ . '/dashboard-sections.php';

		// Opt-in CSV export settings.
		require_once __DIR__ . '/csv-exports.php';
		configure_csv_exports();
	}

	/**
	 * Serve the dashboard support routes from the site. Simple skips this —
	 * WPCOM calls Dashboard_Support_Routes::register() itself instead.
	 *
	 * @return void
	 */
	private static function register_dashboard_support_routes() {
		Dashboard_Support_Routes::register();
	}

	/**
	 * Load the wp-build output (interceptor, modules, routes, page render).
	 *
	 * Must run before the is_admin() gate: the registry serves REST requests
	 * too (is_admin() false there). Render pieces self-gate on admin_init, so
	 * this is inert off the dashboard.
	 *
	 * @return void
	 */
	private static function load_build() {
		$build_entry = __DIR__ . '/../build/build.php';
		if ( file_exists( $build_entry ) ) {
			require_once $build_entry;
		}
	}

	/**
	 * Register the admin-only render path: polyfills, menu, and page hooks.
	 *
	 * @return void
	 */
	private static function register_admin_page() {
		if ( ! is_admin() ) {
			return;
		}

		// Polyfills force-replace core handles (wp-private-apis) on wp_default_scripts;
		// scope to the dashboard page so no other admin page (e.g. block editor) is hit.
		if ( self::is_dashboard_request() ) {
			WP_Build_Polyfills::register(
				'jetpack-premium-analytics',
				array_merge(
					WP_Build_Polyfills::SCRIPT_HANDLES,
					WP_Build_Polyfills::MODULE_IDS
				)
			);
		}

		add_action( 'admin_menu', array( static::class, 'register_admin_menu' ) );
		add_action( 'jetpack-premium-analytics_init', array( static::class, 'register_sidebar_items' ) );
		add_action( 'jetpack-premium-analytics_init', array( static::class, 'ensure_script_data' ) );
	}

	/**
	 * Admin page slugs that render the Premium Analytics dashboard.
	 *
	 * Mirrors the slugs the wp-build interceptor renders (full-page and the
	 * wp-admin integrated variant).
	 */
	const DASHBOARD_PAGE_SLUGS = array( 'jetpack-premium-analytics', 'jetpack-premium-analytics-wp-admin' );

	/**
	 * Whether the current request is rendering a Premium Analytics dashboard page.
	 *
	 * Used to scope the wp-build polyfill registration (which force-replaces core
	 * script handles) to this dashboard, so it never affects other admin pages.
	 * Must be cheap and safe to call at plugin-load time, before current_screen
	 * exists, so it reads the menu page slug directly like the build interceptor does.
	 *
	 * @return bool True when serving a dashboard page in wp-admin.
	 */
	public static function is_dashboard_request() {
		if ( ! is_admin() ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the menu page slug to scope asset loading; no state is changed.
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';

		return in_array( $page, self::DASHBOARD_PAGE_SLUGS, true );
	}

	/**
	 * Register the admin menu page.
	 *
	 * Uses the wp-build "wp-admin integrated" variant (`-wp-admin` slug) so the
	 * dashboard renders inside the native wp-admin shell, not the full-page
	 * variant that takes over the screen via admin_init. The render callback
	 * comes from the generated build, with a no-op fallback when it is absent.
	 *
	 * @return void
	 */
	public static function register_admin_menu() {
		$render_callback = function_exists( 'jpa_jetpack_premium_analytics_wp_admin_render_page' )
			? 'jpa_jetpack_premium_analytics_wp_admin_render_page'
			: '__return_null';

		add_menu_page(
			esc_html( self::$menu_title ),
			esc_html( self::$menu_title ),
			'manage_options',
			'jetpack-premium-analytics-wp-admin',
			$render_callback,
			'dashicons-chart-bar',
			2
		);
	}

	/**
	 * Register sidebar menu items for the full-page app.
	 *
	 * @return void
	 */
	public static function register_sidebar_items() {
		if ( ! function_exists( 'jpa_register_jetpack_premium_analytics_menu_item' ) ) {
			return;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above.
		jpa_register_jetpack_premium_analytics_menu_item(
			'dashboard',
			__( 'Dashboard', 'jetpack-premium-analytics-pkg' ),
			'/'
		);
	}

	/**
	 * Emit window.JetpackScriptData on the boot-rendered admin page.
	 *
	 * The wp-build interceptor that renders this page (its page.php template)
	 * reproduces wp-admin/admin-header.php but does not fire the
	 * `admin_print_scripts` action. The jetpack-assets Script_Data class hooks
	 * that action to print `window.JetpackScriptData` — which carries the
	 * connection data the route guards read — so without help the global is
	 * never emitted and the guards cannot tell whether the site is connected.
	 *
	 * Hooked on the page's own init action, this runs only for this page, in
	 * time for the footer scripts to print. Script_Data guards against rendering
	 * twice, so it is a no-op wherever `admin_print_scripts` fires normally.
	 *
	 * @return void
	 */
	public static function ensure_script_data() {
		$script_data = 'Automattic\Jetpack\Assets\Script_Data';
		if ( is_callable( array( $script_data, 'render_script_data' ) ) ) {
			$script_data::render_script_data();
		}
	}
}
