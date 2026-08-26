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
 * Loads the wp-build output and registers the dashboard's admin page.
 */
class Analytics {

	const PACKAGE_VERSION = '0.4.0';

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
		self::remove_full_page_interceptor();
		self::register_admin_page();
	}

	/**
	 * Whether this request can render an admin screen.
	 *
	 * Core also sets is_admin() on admin-ajax.php and admin-post.php, which render
	 * no dashboard and for which this package registers no handlers, so neither
	 * needs the build parsed.
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

		// The posts and pages list tables link their views column here.
		Post_List_Link::register();
	}

	/**
	 * URL of a dashboard route on this site.
	 *
	 * The SPA path travels in `p`; the router reads that param and ignores the
	 * rest of the query. Encoded here because add_query_arg() leaves values
	 * alone, and a `?` inside the path would read as an outer query param.
	 *
	 * @since 0.4.0
	 *
	 * @param string $path Route path, e.g. `/post/123`.
	 * @return string
	 */
	public static function dashboard_url( $path = '/' ) {
		return admin_url( 'admin.php?page=' . self::MENU_PAGE_SLUG . '&p=' . rawurlencode( $path ) );
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
	 * `siteTimeZone()`: analytics links point at past dates, so they cross
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

		// VideoPress availability for the client's video routes. The widget layer
		// reads the same signal through widget-type-support.php.
		if ( ! function_exists( __NAMESPACE__ . '\\configure_videopress_availability' ) ) {
			require_once __DIR__ . '/videopress-availability.php';
		}
		configure_videopress_availability();
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
	 * Unhook wp-build's full-page render interceptor.
	 *
	 * It renders `?page=jetpack-premium-analytics` — a slug the menu never
	 * registers — from admin_init, with no capability check of its own. On
	 * wp-admin screens Core already refuses that slug first, in
	 * wp-admin/includes/menu.php, which admin.php requires before admin_init;
	 * admin-post.php and admin-ajax.php reach admin_init without that check, and
	 * renders_admin_chrome() is what currently keeps the build off both. Unhooking
	 * removes the reliance on that single guard.
	 *
	 * wp-build derives the callback name from the page slug, and remove_action() is
	 * a no-op on a name or priority it doesn't find — so drift would put the second
	 * entry point back silently. Nothing to remove is normal (the build may be
	 * absent), but a live interceptor we failed to unhook is not, so say so the way
	 * register_admin_menu() reports incomplete build output.
	 *
	 * @return void
	 */
	private static function remove_full_page_interceptor() {
		if ( remove_action( 'admin_init', 'jpa_jetpack_premium_analytics_intercept_render' ) ) {
			return;
		}

		if ( function_exists( 'jpa_jetpack_premium_analytics_intercept_render' ) ) {
			_doing_it_wrong(
				__METHOD__,
				'The Premium Analytics full-page interceptor could not be unhooked: wp-build changed the generated callback name or its admin_init priority.',
				''
			);
		}
	}

	/**
	 * Absolute path to the generated widget manifest.
	 *
	 * On the class rather than beside its readers in widget-modules.php: two copies
	 * of this package can load in one request, and only classes go through the
	 * autoloader's version dedupe. See load_dashboard_components().
	 *
	 * @return string
	 */
	public static function widget_manifest_path() {
		/**
		 * Filters the path to the generated widget manifest.
		 *
		 * @param string $path Absolute path to the generated widget manifest.
		 */
		return apply_filters(
			'jetpack_premium_analytics_widgets_manifest_path',
			__DIR__ . '/../build/widgets.php'
		);
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
			// translation catalogs.
			add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_i18n_loader' ) );
		}

		add_action( 'admin_menu', array( static::class, 'register_admin_menu' ) );
	}

	/**
	 * The admin page slug the dashboard menu registers. Published in script data
	 * so no caller has to hard-code it.
	 */
	const MENU_PAGE_SLUG = 'jetpack-premium-analytics-wp-admin';

	/**
	 * Whether the current request is rendering the Premium Analytics dashboard.
	 *
	 * Used to scope the wp-build polyfill registration (which force-replaces core
	 * script handles) to this dashboard, so it never affects other admin pages.
	 * Must be cheap and safe to call at plugin-load time, before current_screen
	 * exists, so it reads the menu page slug directly.
	 *
	 * @return bool True when serving the dashboard page in wp-admin.
	 */
	public static function is_dashboard_request() {
		if ( ! is_admin() ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the menu page slug to scope asset loading; no state is changed.
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';

		return self::MENU_PAGE_SLUG === $page;
	}

	/**
	 * Register the admin menu page.
	 *
	 * Uses wp-build's `-wp-admin` variant so Core applies the menu capability check.
	 * The generated build provides the render callback; a missing build shows a
	 * notice instead of an empty page.
	 *
	 * Report missing page and widget build artifacts independently because the
	 * build loader includes each one conditionally.
	 *
	 * @return void
	 */
	public static function register_admin_menu() {
		$can_render          = function_exists( 'jpa_jetpack_premium_analytics_wp_admin_render_page' );
		$has_widget_manifest = file_exists( self::widget_manifest_path() );

		$missing = array();
		if ( ! $can_render ) {
			// Named by symbol, not by file: build/pages.php is only a loader, and the
			// callback can also go missing to a renamed page slug or an absent build entry.
			$missing[] = 'the jpa_jetpack_premium_analytics_wp_admin_render_page() callback, generated under build/pages/';
		}
		if ( ! $has_widget_manifest ) {
			$missing[] = 'build/widgets.php (the widget manifest)';
		}

		if ( $missing ) {
			// Surfaced here rather than only on the page itself, so a partial deploy shows up on
			// the first admin request instead of waiting for someone to open the dashboard.
			_doing_it_wrong(
				__METHOD__,
				// esc_html() only to satisfy WordPress.Security.EscapeOutput, which treats
				// this argument as output; every entry is a literal from just above.
				'The Premium Analytics build output is incomplete: ' . esc_html( implode( ', ', $missing ) ) . '. The package build did not run, or ran only partially, for this deploy.',
				''
			);
		}

		$render_callback = $can_render
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
