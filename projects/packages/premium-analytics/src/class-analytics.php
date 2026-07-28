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
	 * Menu title override for the admin page. Null falls back to the package's
	 * own translated label, resolved on admin_menu — callers init far too early
	 * to translate anything themselves. A closure is resolved there too, which is
	 * how a caller supplies a label in its own textdomain.
	 *
	 * @var string|\Closure|null
	 */
	private static $menu_title = null;

	/**
	 * The menu label once resolved, so the menu and the missing-build notice can't
	 * disagree if a caller hands us a closure that returns something different
	 * each call. Reset whenever $menu_title is assigned.
	 *
	 * @var string|null
	 */
	private static $resolved_menu_title = null;

	/**
	 * Initialize the Analytics app on a connected Jetpack site.
	 *
	 * Registers the full local surface: the site serves the WPCOM data proxy,
	 * notices, sync bootstrap, and the dashboard support routes itself.
	 *
	 * @param array $options Optional configuration options.
	 *                       Supported keys:
	 *                       - menu_title (string|\Closure): Admin menu label. Defaults to
	 *                         the package's own translated label. Pass a closure to supply
	 *                         a translated label of your own: it runs on admin_menu, where
	 *                         a textdomain can load, unlike init time.
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
	 *                       - menu_title (string|\Closure): Admin menu label. Defaults to
	 *                         the package's own translated label. Pass a closure to supply
	 *                         a translated label of your own: it runs on admin_menu, where
	 *                         a textdomain can load, unlike init time.
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
			self::$menu_title          = $options['menu_title'];
			self::$resolved_menu_title = null;
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

			// Enqueue the i18n loader so the init module can download its JS
			// translation catalogs. admin_enqueue_scripts covers the wp-admin
			// integrated variant; the full-page interceptor variant does not fire
			// it (see ensure_script_data()), so also hook the page init action.
			add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_i18n_loader' ) );
			add_action( 'jetpack-premium-analytics_init', array( static::class, 'enqueue_i18n_loader' ) );
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
	 * comes from the generated build; when that is missing we say so rather
	 * than render an empty page, since the two look identical from the outside.
	 *
	 * @return void
	 */
	public static function register_admin_menu() {
		$has_build = function_exists( 'jpa_jetpack_premium_analytics_wp_admin_render_page' );

		if ( ! $has_build ) {
			// Surfaced here rather than only on the page itself, so a partial deploy shows up on
			// the first admin request instead of waiting for someone to open the dashboard.
			_doing_it_wrong(
				__METHOD__,
				'The Premium Analytics build output is missing, so the dashboard cannot render. The package build did not run for this deploy.',
				''
			);
		}

		$render_callback = $has_build
			? 'jpa_jetpack_premium_analytics_wp_admin_render_page'
			: array( __CLASS__, 'render_missing_build_notice' );

		$menu_title = self::menu_title();

		add_menu_page(
			esc_html( $menu_title ),
			esc_html( $menu_title ),
			'manage_options',
			'jetpack-premium-analytics-wp-admin',
			$render_callback,
			'dashicons-chart-bar',
			2
		);
	}

	/**
	 * Stand-in for the generated render callback when the build output is absent.
	 *
	 * The PHP classes come from Composer and the build output from pnpm, so a
	 * partial deploy can leave the class loadable with nothing to render.
	 *
	 * @return void
	 */
	public static function render_missing_build_notice() {
		printf(
			'<div class="wrap"><h1>%s</h1><p>%s</p></div>',
			esc_html( self::menu_title() ),
			esc_html__( 'The Premium Analytics assets are missing. The package build did not run for this deploy.', 'jetpack-premium-analytics-pkg' )
		);
	}

	/**
	 * The caller's menu label override, or the package's own translated label.
	 *
	 * Only call once translations can load — admin_menu or later. Memoized, so every
	 * call site in a request shows the same label.
	 *
	 * Closures are resolved here rather than at init time, so a caller can hand us
	 * `__()` in its own textdomain without translating too early. Deliberately not
	 * is_callable(): PHP function names are case-insensitive, so a plain label like
	 * "Analytics" would match a stray analytics() function and get called.
	 *
	 * @return string
	 */
	private static function menu_title() {
		if ( null !== self::$resolved_menu_title ) {
			return self::$resolved_menu_title;
		}

		$title = self::$menu_title instanceof \Closure
			? ( self::$menu_title )()
			: self::$menu_title;

		// A positive check rather than a null coalesce: a closure is free to return an
		// empty string, or something that isn't a string at all, and either would reach
		// esc_html() as a broken label instead of falling back here.
		self::$resolved_menu_title = is_string( $title ) && '' !== $title
			? $title
			: __( 'Analytics', 'jetpack-premium-analytics-pkg' );

		return self::$resolved_menu_title;
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

	/**
	 * Enqueue the i18n loader so the wp-build init module can download its JS
	 * translation catalogs. It's registered on every admin page by jetpack-assets
	 * but only enqueued when depended on; the esbuild bundles don't pull it in.
	 *
	 * @return void
	 */
	public static function enqueue_i18n_loader() {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}
}
