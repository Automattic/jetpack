<?php
/**
 * Analytics package main class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Admin_UI\Admin_Shell;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Export;
use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use Automattic\Jetpack\PremiumAnalytics\REST\Notices_Controller;
use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Main Analytics class.
 *
 * Loads the wp-build output and registers the dashboard's admin page.
 */
class Analytics {

	const PACKAGE_VERSION = '0.17.0';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Menu title override for the admin page. Null falls back to the package's own
	 * translated label, resolved on admin_menu — init runs far too early to translate.
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
	 * Whether the host has this dashboard replace stats-admin's pre-connection Stats page.
	 *
	 * @var bool
	 */
	private static $replaces_pre_connection_stats_page = false;

	/**
	 * Whether this request is the admin shell's guest endpoint loading the dashboard into another page.
	 *
	 * @var bool
	 */
	private static $serving_shell_guest = false;

	/**
	 * Path to the wp-build entry point. Null uses the generated build.
	 *
	 * A test seam: `build/` is gitignored and test-php runs no build step, so tests redirect this
	 * instead. Private, so — unlike the widget manifest's path — it needs no filter to stay out of reach.
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
	 * Hosts call this on every request once the flag is on, never only on admin ones: the
	 * store-event tracker listens on the front end. {@see self::load_dashboard_surface()} is what
	 * keeps the admin-only work off those requests.
	 *
	 * @param array $options Optional configuration options.
	 *                       Supported keys:
	 *                       - menu_title (string|\Closure): Admin menu label. Defaults to
	 *                         the package's own translated label. Pass a closure to supply
	 *                         a translated label of your own: it runs on admin_menu, where
	 *                         a textdomain can load, unlike init time.
	 *                       - replaces_pre_connection_stats_page (bool): Stop stats-admin from
	 *                         registering its own Stats page while the site is not connected, so
	 *                         this dashboard is the only Stats entry. Defaults to whether classic
	 *                         Stats is retired.
	 *                       A later call still applies its options, so a host that calls this after
	 *                       another plugin did keeps its configuration.
	 * @return void
	 */
	public static function init( $options = array() ) {
		self::apply_options( $options );
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		self::register_sync_bootstrap();
		self::register_local_api();

		// Piggybacks on the Jetpack Stats module; checks Jetpack connection state.
		Jetpack_Stats_Tracker::configure();
		self::register_pre_connection_stats_page_replacement();

		self::boot_shared_services();
		self::register_dashboard_support_routes();
		self::load_dashboard_surface();
		self::register_admin_shell_member();
	}

	/**
	 * Whether Stats v2 booted in this request, whichever plugin or platform booted it.
	 *
	 * @since 0.16.0
	 *
	 * @return bool
	 */
	public static function is_initialized() {
		return self::$initialized;
	}

	/**
	 * Load the dashboard render surface, on the requests that can render it.
	 *
	 * With the rollout flag on, init() runs on every request — including every WPCOM public-api
	 * request on Simple — so this stays gated for visitors who never use it (REST excluded; see load_build()).
	 *
	 * @return void
	 */
	private static function load_dashboard_surface() {
		if ( ! self::renders_admin_chrome() ) {
			// Calypso's sidebar replays wp-admin/menu.php over REST, where nothing else lists the dashboard.
			add_action( 'admin_menu', array( static::class, 'register_replayed_admin_menu' ) );
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
	 * Core also sets is_admin() on admin-ajax.php and admin-post.php, which render no dashboard
	 * and get no handlers from this package, so neither needs the build parsed.
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
	 * Simple reaches public-api.wordpress.com directly via WPCOM's apiFetch bridge, registering
	 * no local REST surface (no proxy, notices, sync bootstrap, or dashboard routes) — WPCOM handles those.
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
		self::apply_options( $options );
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

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
		if ( ! empty( $options['replaces_pre_connection_stats_page'] ) ) {
			self::$replaces_pre_connection_stats_page = true;
		}
	}

	/**
	 * Replace stats-admin's pre-connection Stats page with this dashboard when the host asks, or once classic Stats is retired.
	 *
	 * The callback reads the option when stats-admin initializes on `plugins_loaded`, so a host whose
	 * init() call comes after another plugin's still takes effect.
	 *
	 * @return void
	 */
	private static function register_pre_connection_stats_page_replacement() {
		add_filter(
			'jetpack_stats_admin_pre_connection_dashboard',
			static function ( $register ) {
				return self::$replaces_pre_connection_stats_page || Classic_Stats::is_retired() ? false : $register;
			}
		);
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

		// Stats links elsewhere (post list table, admin bar, action bar) open this dashboard.
		Stats_Links::register();
	}

	/**
	 * URL of a dashboard route on this site.
	 *
	 * The SPA path travels in `p`, encoded here since add_query_arg() leaves values alone and a
	 * raw `?` inside it would read as an outer query param.
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
	 * Announce to Jetpack's other surfaces that this dashboard is the site's analytics UI,
	 * so they link here instead of the Stats page.
	 *
	 * @return void
	 */
	private static function register_script_data() {
		add_filter( 'jetpack_admin_js_script_data', array( static::class, 'add_script_data' ) );
	}

	/**
	 * Runs on nearly every admin page load, so the payload stays to two strings,
	 * a bool, and one access check.
	 *
	 * `can_view` is whether this user can open a Stats view: every link other surfaces build from it opens one.
	 *
	 * @param array $data The script data.
	 * @return array The script data with the analytics key added.
	 */
	public static function add_script_data( $data ) {
		$data['analytics'] = array(
			'enabled'   => true,
			'page_slug' => self::MENU_PAGE_SLUG,
			'can_view'  => Capabilities::current_user_can_open_stats(),
			'timezone'  => self::site_timezone(),
		);

		return $data;
	}

	/**
	 * Prefers `timezone_string` over `gmt_offset`, matching the dashboard's own `siteTimeZone()`:
	 * analytics links point at past dates, so a fixed offset applied to the far side of a
	 * daylight-saving transition shifts the day.
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
	}

	/**
	 * Register the site-served REST API: the WPCOM data proxy, notices and the Stats settings.
	 *
	 * Each self-gates on its own rest_api_init hook.
	 *
	 * @return void
	 */
	private static function register_local_api() {
		Api_Proxy_Controller::register();
		Notices_Controller::register();
		Stats_Settings::configure();
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
		// Widget modules for the client's dynamic import() map.
		require_once __DIR__ . '/widget-modules.php';

		// Default layout primitives and the bundled defaults' seed.
		require_once __DIR__ . '/dashboard-layout.php';

		// Dashboard section API, then the package's own sections registered through it.
		require_once __DIR__ . '/dashboard-sections.php';
		require_once __DIR__ . '/default-dashboard-sections.php';
		configure_dashboard_sections_script_data();

		// Single-report page API, then the package's own pages registered through it.
		require_once __DIR__ . '/single-report-pages.php';
		require_once __DIR__ . '/default-single-report-pages.php';
		configure_single_report_pages_script_data();

		// Default-on CSV export settings and server-side disable filter.
		require_once __DIR__ . '/csv-exports.php';
		configure_csv_exports();

		// VideoPress availability for the client's video routes. The widget layer
		// reads the same signal through widget-type-support.php.
		require_once __DIR__ . '/videopress-availability.php';
		configure_videopress_availability();

		// The plan's locked Stats features, for the client's locked states.
		require_once __DIR__ . '/stats-plan-gates.php';
		configure_stats_plan_gates();

		// The purchase a Stats checkout returned with, for the thank-you notice.
		require_once __DIR__ . '/purchase-success.php';
		configure_purchase_success();

		// When the site first opened the dashboard, for notices that wait a while before showing.
		require_once __DIR__ . '/dashboard-first-visit.php';
		configure_dashboard_first_visit();

		require_once __DIR__ . '/assets-url.php';
		configure_assets_url();

		// The locale's default date format, for site formats the dashboard cannot shorten.
		require_once __DIR__ . '/date-format.php';
		configure_date_format();

		// Temporary: carries a default layout move into layouts readers customized before it.
		Stored_Layout_Move::register();
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
			require_once __DIR__ . '/sdk-module.php';
		}
	}

	/**
	 * Unhook wp-build's full-page render interceptor — security-relevant: it renders
	 * `?page=jetpack-premium-analytics` from admin_init with no capability check, and only
	 * renders_admin_chrome() gates the admin-post.php/admin-ajax.php paths that reach admin_init
	 * without Core's own slug check.
	 *
	 * Because remove_action() no-ops on a callback name it can't find, a wp-build rename would
	 * silently restore this entry point — hence the _doing_it_wrong() below when that happens.
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

			add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_i18n_loader' ) );
			add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_tracks_transport' ) );
			add_filter( 'jetpack_admin_js_script_data', array( static::class, 'add_tracks_identity_script_data' ), 20 );
			add_action( 'admin_page_access_denied', array( static::class, 'redirect_denied_dashboard_request' ) );
		}

		add_action( 'admin_menu', array( static::class, 'register_admin_menu' ) );
	}

	/**
	 * Join the admin shell, which switches between Jetpack dashboards without a page load.
	 *
	 * @return void
	 */
	private static function register_admin_shell_member() {
		if ( ! class_exists( Admin_Shell::class ) ) {
			return;
		}
		add_filter( 'jetpack_admin_shell_members', array( static::class, 'add_admin_shell_member' ) );
		// The standalone plugin reaches admin-ui only through the admin menu, which admin-ajax never builds.
		if ( method_exists( Admin_Shell::class, 'init' ) ) {
			Admin_Shell::init();
		}
	}

	/**
	 * Register the dashboard with the admin shell.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $members Shell members keyed by admin page slug.
	 * @return array
	 */
	public static function add_admin_shell_member( $members ) {
		if ( ! file_exists( self::$build_entry ?? __DIR__ . '/../build/build.php' ) ) {
			return $members;
		}

		// The guest endpoint checks the capability before it loads anything, and the capability depends on the sections.
		require_once __DIR__ . '/dashboard-layout.php';
		require_once __DIR__ . '/default-dashboard-sections.php';

		$members[ self::MENU_PAGE_SLUG ] = array(
			'build_prefix' => 'jpa',
			'build_page'   => 'jetpack-premium-analytics',
			'init_modules' => array( '@jetpack-premium-analytics/init' ),
			'title'        => self::menu_title(),
			'capability'   => Capabilities::dashboard_page_capability(),
			'handles'      => array( 'jetpack-script-data', 'wp-api-fetch', 'wp-jp-i18n-loader', 'jp-tracks' ),
			'load'         => array( static::class, 'load_as_admin_shell_guest' ),
		);
		return $members;
	}

	/**
	 * Ready the dashboard's routes and page data while another dashboard's page is open.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function load_as_admin_shell_guest() {
		// The guest endpoint runs on admin-ajax, where load_dashboard_surface() loads nothing.
		if ( wp_doing_ajax() && ! self::$serving_shell_guest ) {
			self::$serving_shell_guest = true;
			self::load_dashboard_components();
			self::load_build();
			self::remove_full_page_interceptor();
			self::register_admin_page();
			// configure() decided this at init, before this request was known to be the dashboard's.
			add_filter( 'jetpack_admin_js_script_data', array( Stats_Settings::class, 'add_script_data' ), 20 );
		} else {
			WP_Build_Polyfills::register(
				'jetpack-premium-analytics',
				array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
			);
		}

		// The generated registration runs on wp_default_scripts, which may already have fired.
		if ( function_exists( 'jpa_register_script_modules' ) ) {
			jpa_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Defined in the generated build/modules.php.
		}
	}

	/**
	 * Sends a reader who lost access, for example because the site was disconnected, to the
	 * wp-admin Dashboard instead of the "not allowed" screen.
	 *
	 * @return never
	 */
	public static function redirect_denied_dashboard_request() {
		wp_safe_redirect( admin_url() );
		exit;
	}

	/**
	 * The admin page slug the dashboard menu registers. Published in script data
	 * so no caller has to hard-code it.
	 */
	const MENU_PAGE_SLUG = 'jetpack-premium-analytics-wp-admin';

	/**
	 * Where the dashboard sits in the admin menu: under the Dashboard, and on WordPress.com
	 * between My Home (2.01) and Hosting (2.98).
	 *
	 * Not 2, which the Dashboard holds: core gives a second entry there a hashed fraction to
	 * tell the two apart, and the menu's natural sort reads one such as .21518 as past .99.
	 */
	private const MENU_POSITION = 2.1;

	/**
	 * Whether the current request is rendering the Premium Analytics dashboard.
	 *
	 * Scopes the wp-build polyfill registration (which force-replaces core script handles) to
	 * this dashboard; reads the menu slug directly, not current_screen, to stay safe at plugin-load time.
	 *
	 * @return bool True when serving the dashboard page in wp-admin.
	 */
	public static function is_dashboard_request() {
		if ( ! is_admin() ) {
			return false;
		}

		if ( self::$serving_shell_guest ) {
			return true;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the menu page slug to scope asset loading; no state is changed.
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';

		return self::MENU_PAGE_SLUG === $page;
	}

	/**
	 * Register the admin menu page.
	 *
	 * Uses wp-build's `-wp-admin` variant so Core applies the menu capability check. Reports the
	 * page and widget artifacts independently since the build loader includes each conditionally.
	 *
	 * Queued through Admin_Menu rather than registered here, so the entry is reachable by the
	 * `jetpack_admin_menu_visibility` filter.
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

		self::add_dashboard_menu_entry( $render_callback );
	}

	/**
	 * List the dashboard in a menu built outside wp-admin, such as the one the admin-menu REST endpoint returns.
	 *
	 * Loads the section registry but not the build: the menu capability depends on the sections.
	 * Do not rename: wpcomsh retires classic Stats on Atomic only while this method exists.
	 *
	 * @since 0.17.0
	 *
	 * @return void
	 */
	public static function register_replayed_admin_menu() {
		require_once __DIR__ . '/dashboard-layout.php';
		require_once __DIR__ . '/default-dashboard-sections.php';

		self::add_dashboard_menu_entry( '__return_null' );
	}

	/**
	 * Add the dashboard's top-level menu entry.
	 *
	 * @param callable $render_callback Renders the page.
	 * @return void
	 */
	private static function add_dashboard_menu_entry( $render_callback ) {
		$menu_title = esc_html( self::menu_title() );
		$capability = Capabilities::dashboard_page_capability();

		// An older admin-ui, loaded first by another plugin, may predate add_top_level_menu().
		if ( ! method_exists( Admin_Menu::class, 'add_top_level_menu' ) ) {
			add_menu_page( $menu_title, $menu_title, $capability, self::MENU_PAGE_SLUG, $render_callback, 'dashicons-chart-bar', self::MENU_POSITION );
			return;
		}

		// A fixed key rather than the slug, which carries a build-specific suffix. No gate:
		// the dashboard has no My Jetpack product class and no module to name.
		Admin_Menu::add_top_level_menu( $menu_title, $menu_title, $capability, self::MENU_PAGE_SLUG, $render_callback, 'dashicons-chart-bar', self::MENU_POSITION, array( 'key' => 'jetpack-premium-analytics' ) );
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
	 * Call only once translations can load — admin_menu or later — and memoize so every call site
	 * agrees. Deliberately not is_callable(): PHP function names are case-insensitive, so a plain
	 * label like "Analytics" could match a stray analytics() function and get called.
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

		// A positive check rather than a null coalesce: a closure may return an empty string, or
		// something that isn't a string at all, and either would reach esc_html() as a broken label.
		if ( is_string( $title ) && '' !== $title ) {
			self::$resolved_menu_title = $title;
		} elseif ( Classic_Stats::is_retired() ) {
			// No classic Stats menu is left to tell apart from.
			self::$resolved_menu_title = __( 'Stats', 'jetpack-premium-analytics-pkg' );
		} else {
			self::$resolved_menu_title = __( 'Stats v2', 'jetpack-premium-analytics-pkg' );
		}

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

	/**
	 * Load the Tracks transport for the dashboard.
	 *
	 * `@automattic/jetpack-analytics` only queues events into `window._tkq` — its own w.js
	 * loader is disabled — so without this handle no `jetpack_premium_analytics_*` event
	 * ever flushes. Simple is skipped because stats.php already prints the same script.
	 *
	 * @return void
	 */
	public static function enqueue_tracks_transport() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
	}

	/**
	 * Publish the WPCOM identity the dashboard attributes its Tracks events to.
	 *
	 * Core's script data carries only the local user. Publicize is the one package that fills
	 * `current_user.wpcom` in, and the standalone plugin does not bundle it, so without this
	 * every event would land anonymous there.
	 *
	 * @param array $data The script data.
	 * @return array The script data with the WPCOM identity added.
	 */
	public static function add_tracks_identity_script_data( $data ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			$wpcom_user = array(
				'ID'    => get_current_user_id(),
				'login' => wp_get_current_user()->user_login,
			);
		} else {
			$connected = ( new Connection_Manager() )->get_connected_user_data();

			if ( empty( $connected['ID'] ) || empty( $connected['login'] ) ) {
				return $data;
			}

			// Only the two fields `identifyUser` needs: the rest of the connected-user payload
			// is profile data the dashboard never reads.
			$wpcom_user = array(
				'ID'    => $connected['ID'],
				'login' => $connected['login'],
			);
		}

		$data['user']['current_user']['wpcom'] = array_merge(
			$data['user']['current_user']['wpcom'] ?? array(),
			$wpcom_user
		);

		return $data;
	}
}
