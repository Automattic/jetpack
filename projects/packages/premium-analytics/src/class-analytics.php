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

	const PACKAGE_VERSION = '0.2.0';

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
	 * Path to the wp-build entry point. Null uses the generated build.
	 *
	 * A test seam: `build/` is gitignored and `test-php` runs no build step, so a
	 * test has nothing to observe unless it can redirect this. Private, so unlike
	 * the widget manifest's path it needs no filter to stay out of reach.
	 *
	 * @var string|null
	 */
	private static $build_entry = null;

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
		self::load_dashboard_surface();
	}

	/**
	 * Load the dashboard render surface, on the requests that can render it.
	 *
	 * With the rollout flag on, init() runs on every request — on WordPress.com
	 * Simple, every request across WPCOM's public-api process — so everything
	 * below would otherwise be parsed for visitors who can never use it.
	 *
	 * REST serves the dashboard too but is deliberately excluded: it loads what
	 * it needs itself. See load_build().
	 *
	 * @return void
	 */
	private static function load_dashboard_surface() {
		if ( ! self::renders_admin_chrome() ) {
			return;
		}

		self::load_dashboard_components();
		self::load_build();
		self::register_admin_page();
	}

	/**
	 * Whether this request can render an admin screen.
	 *
	 * Core also sets is_admin() on admin-ajax.php and admin-post.php, which render
	 * no dashboard and for which this package registers no handlers. Both fire
	 * admin_init before core checks the user is logged in, and the build's
	 * interceptor keys on $_GET['page'] alone, so without these exclusions either
	 * endpoint answers ?page=jetpack-premium-analytics with a full dashboard page
	 * — to anyone.
	 *
	 * Narrowing the request is as far as this package can go: the interceptor has
	 * no capability check of its own, so any logged-in user still reaches it
	 * through an ordinary admin screen. That fix belongs in the wp-build output.
	 *
	 * @return bool
	 */
	private static function renders_admin_chrome() {
		if ( ! is_admin() || wp_doing_ajax() ) {
			return false;
		}

		// wp-includes/vars.php sets $pagenow before plugins load.
		return 'admin-post.php' !== ( $GLOBALS['pagenow'] ?? '' );
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
		self::load_dashboard_surface();
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
	 * Boot the services every platform needs, whether or not the site serves the
	 * dashboard support routes itself.
	 *
	 * @return void
	 */
	private static function boot_shared_services() {
		// Must be hooked before admin_menu and rest_api_init check the capability.
		Capabilities::register();

		// Emit WooCommerce store events into the Woo pipeline (ClickHouse + proxy).
		WooCommerce_Analytics_Tracker::configure();

		// CSV report export pipeline (WOOA7S-1581): hooks rest_api_init, so it must
		// register on all requests. Self-gates on WooCommerce + Jetpack connection.
		Export::configure();

		self::register_script_data();
	}

	/**
	 * Announce to Jetpack's other surfaces that this dashboard is the site's
	 * analytics UI, so they link here instead of the Stats page. Publishing it
	 * from the package that owns the dashboard means the key exists exactly
	 * where the dashboard does. Registered from both init paths, so Simple gets
	 * it too.
	 *
	 * @return void
	 */
	private static function register_script_data() {
		add_filter( 'jetpack_admin_js_script_data', array( static::class, 'add_script_data' ) );
	}

	/**
	 * Runs on nearly every admin page load, so the payload stays to two strings,
	 * a bool, and one capability check.
	 *
	 * @param array $data The script data.
	 * @return array The script data with the analytics key added.
	 */
	public static function add_script_data( $data ) {
		$data['analytics'] = array(
			'enabled'   => true,
			'page_slug' => self::MENU_PAGE_SLUG,
			'can_view'  => current_user_can( Capabilities::VIEW_ANALYTICS ),
			'timezone'  => self::site_timezone(),
		);

		return $data;
	}

	/**
	 * Prefers `timezone_string` over `gmt_offset`, matching the dashboard's own
	 * `getSiteTimezone()`: analytics links point at past dates, so they cross
	 * daylight-saving boundaries routinely, and a fixed offset applied to the far
	 * side of a transition shifts the day.
	 *
	 * @return string An IANA timezone name, or a `+HH:MM` UTC offset.
	 */
	private static function site_timezone() {
		$timezone_string = get_option( 'timezone_string' );

		if ( is_string( $timezone_string ) && $timezone_string !== '' ) {
			return $timezone_string;
		}

		return self::format_gmt_offset( (float) get_option( 'gmt_offset' ) );
	}

	/**
	 * Format a GMT offset in hours as `+HH:MM`.
	 *
	 * @param float $offset The offset in hours, e.g. 5.5 or -8.
	 * @return string The formatted offset.
	 */
	private static function format_gmt_offset( $offset ) {
		$sign     = $offset < 0 ? '-' : '+';
		$absolute = abs( $offset );
		$hours    = (int) floor( $absolute );
		$minutes  = (int) round( ( $absolute - $hours ) * 60 );

		return sprintf( '%s%02d:%02d', $sign, $hours, $minutes );
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
	 * Admin-only, via load_dashboard_surface(); boot_routes() requires these
	 * again for REST.
	 *
	 * @return void
	 */
	private static function load_dashboard_components() {
		/*
		 * Every include below is guarded on a symbol the target file declares.
		 *
		 * Two copies of this package can be loaded in one request — WPCOM Simple ships
		 * one under jetpack-plugin and another under jetpack-mu-wpcom-plugin. The
		 * autoloader dedupes classes by version, but these files declare functions and
		 * constants at file scope, so they are absent from the classmap entirely and
		 * reach us through `require_once`, which dedupes by path and not by symbol.
		 * Once a class from one copy and a class from the other both run their
		 * includes, PHP fatals on the redeclared functions. The guards make the second
		 * copy's include a no-op, which also keeps the files' file-scope side effects
		 * (add_filter() calls, registry bootstrapping) from running twice.
		 */

		// Widget modules for the client's dynamic import() map.
		if ( ! function_exists( __NAMESPACE__ . '\\register_widget_modules_rest_route' ) ) {
			require_once __DIR__ . '/widget-modules.php';
		}

		// Default layout's first-load preference injection.
		if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_default_layout_route' ) ) {
			require_once __DIR__ . '/dashboard-layout.php';
		}

		// Dashboard sections and their default layout seeding.
		if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_section' ) ) {
			require_once __DIR__ . '/dashboard-sections.php';
		}

		// Default-on CSV export settings and server-side disable filter.
		if ( ! function_exists( __NAMESPACE__ . '\\configure_csv_exports' ) ) {
			require_once __DIR__ . '/csv-exports.php';
		}
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
	 * Admin-only, via load_dashboard_surface(). REST does not need it:
	 * boot_routes() and ensure_widget_registry_ready() load what they use.
	 *
	 * @return void
	 */
	private static function load_build() {
		$build_entry = self::$build_entry ?? __DIR__ . '/../build/build.php';
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
	 * The admin page slug the dashboard menu registers. Published in script data
	 * so no caller has to hard-code it.
	 */
	const MENU_PAGE_SLUG = 'jetpack-premium-analytics-wp-admin';

	/**
	 * Admin page slugs that render the Premium Analytics dashboard.
	 *
	 * Mirrors the slugs the wp-build interceptor renders (full-page and the
	 * wp-admin integrated variant).
	 */
	const DASHBOARD_PAGE_SLUGS = array( 'jetpack-premium-analytics', self::MENU_PAGE_SLUG );

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
			Capabilities::VIEW_ANALYTICS,
			self::MENU_PAGE_SLUG,
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
			: __( 'Stats v2', 'jetpack-premium-analytics-pkg' );

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
