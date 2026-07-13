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
	 * Initialize the Analytics app.
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

		if ( ! empty( $options['menu_title'] ) ) {
			self::$menu_title = $options['menu_title'];
		}

		// Always on: sync runs in cron; REST routes + registry serve REST requests
		// (is_admin() false). REST_REQUEST isn't defined this early, so they
		// self-gate on their own rest_api_init / init hooks.
		Sync_Status_Tracker::configure();

		// TEMPORARY (WOOA7S-1550): register the interim woocommerce_analytics sync module so
		// Sync_Status_Tracker has a full sync to observe. Remove when the shared sync-modules package lands.
		Sync_Configuration::register();
		Api_Proxy_Controller::register();
		Notices_Controller::register();

		// Emit WooCommerce store events into the Woo pipeline (ClickHouse + proxy).
		WooCommerce_Analytics_Tracker::configure();

		// CSV report export pipeline (WOOA7S-1581). Must register above the is_admin() gate so its
		// REST route hooks rest_api_init (is_admin() is false during REST requests). Self-gates on
		// WooCommerce being active + Jetpack connected.
		Export::configure();

		// Load the widget type registry: hydration routine, registry-time and
		// runtime filters, and the registry accessors.
		require_once __DIR__ . '/widget-types.php';

		// Apply Premium Analytics' availability policy: hooks the registry-time
		// filter to keep developer-only types out of production.
		require_once __DIR__ . '/widget-availability.php';

		// Hydrate the registry with the availability filter in place.
		bootstrap_widget_types();

		// Expose dashboard widget modules over REST and wire them into the
		// page import map for dynamic import() on the client.
		require_once __DIR__ . '/widget-modules.php';

		// Register the dashboard's default layout: the first-load preference
		// injection and the REST route the "reset to default" action reads.
		require_once __DIR__ . '/dashboard-layout.php';

		// Register dashboard sections and expose section metadata/defaults over REST.
		require_once __DIR__ . '/dashboard-sections.php';

		// Load wp-build output (interceptor, modules, routes, page render).
		// Must stay above the is_admin() gate: build/widgets.php defines the
		// manifest the widget registry reads, and the registry serves REST
		// requests (e.g. /jetpack/v4/widget-modules) where is_admin() is false. The render
		// pieces here self-gate on admin_init, so loading them globally is inert
		// off the dashboard. Only the polyfill registration below is admin-scoped.
		$build_entry = __DIR__ . '/../build/build.php';
		if ( file_exists( $build_entry ) ) {
			require_once $build_entry;
		}

		// Below: admin-only render path (assets, menu).
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
			__( 'Dashboard', 'jetpack-premium-analytics' ),
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
