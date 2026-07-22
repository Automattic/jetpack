<?php
/**
 * Primary class for the Jetpack Activity Log package.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Activity_Log\Initial_State as Activity_Log_Initial_State;
use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use function add_action;
use function add_filter;
use function current_user_can;
use function did_action;
use function do_action;
use function is_admin;
use function is_multisite;
use function sanitize_text_field;
use function wp_add_inline_script;
use function wp_enqueue_script;
use function wp_register_script;
use function wp_unslash;
use function wp_verify_nonce;

/**
 * Class Jetpack_Activity_Log
 *
 * Registers the Activity Log admin page and its REST routes inside the
 * main Jetpack plugin.
 */
class Jetpack_Activity_Log {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	const PAGE_SLUG = 'jetpack-activity-log';

	/**
	 * Page slug for the wp-build dashboard. Distinct from the wp-admin menu
	 * slug (`PAGE_SLUG`) so the user-facing URL stays `admin.php?page=jetpack-activity-log`;
	 * we alias the current screen id to this value so wp-build's
	 * screen-match enqueue callback fires. Must match the `page` in
	 * `routes/dashboard/package.json` and the `wpPlugin.pages` entry.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_SLUG = 'jetpack-activity-log-dashboard';

	/**
	 * Handle for the classic script that carries the React initial state.
	 * The dashboard is a wp-build script module, so there is no classic
	 * bundle handle to attach inline data to — this empty handle exists
	 * purely to print `JPACTIVITYLOG_INITIAL_STATE` and the Connection
	 * initial state before boot runs.
	 *
	 * @var string
	 */
	const DATA_SCRIPT_HANDLE = 'jetpack-activity-log-data';

	/**
	 * Nonce action for refreshing the access flag after a checkout
	 * return. Used by `admin_init()` below and exposed to the client via
	 * Initial_State so the upsell CTA can embed a valid nonce in its
	 * `redirect_to`. Same shape as `Social_Admin_Page::REFRESH_PLAN_NONCE_ACTION`.
	 *
	 * @var string
	 */
	const REFRESH_ACCESS_NONCE_ACTION = 'jetpack_activity_log_refresh_access';

	/**
	 * Entry point. Idempotent: safe to call from multiple bootstraps.
	 */
	public static function initialize() {
		if ( did_action( 'jetpack_activity_log_initialized' ) ) {
			return;
		}

		add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_filter( 'jetpack_package_versions', array( Package_Version::class, 'send_package_version_to_tracker' ) );

		/**
		 * Fires once the Jetpack Activity Log package has wired its hooks.
		 *
		 * @since 0.1.0
		 */
		do_action( 'jetpack_activity_log_initialized' );
	}

	/**
	 * Register the Activity Log submenu under Jetpack.
	 *
	 * Mirrors the gating used by the legacy my-jetpack "Activity Log" menu
	 * item (connected user + non-multisite).
	 *
	 * @return string|null The resulting page's hook suffix, if registered.
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::is_available() ) {
			return null;
		}

		// Load wp-build only on the Activity Log request so its generated
		// render function exists before the menu callback runs, and its
		// enqueue pipeline/polyfills stay off every other admin page. Alias
		// the screen id here too — `current_screen` fires before the
		// `load-{$page_suffix}` hook that runs admin_init(), so registering
		// the alias from admin_init() would be too late for wp-build's
		// screen-matched enqueue callback.
		if ( self::is_activity_log_admin_request() ) {
			self::load_wp_build();
			add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
		}

		// The menu item must appear on every admin page, but the generated
		// render function is only loaded on the Activity Log request (above).
		// The callback is only ever invoked while rendering our page — where
		// the function is loaded — so the fallback is purely defensive.
		$render_callback = function_exists( 'jetpack_activity_log_jetpack_activity_log_dashboard_wp_admin_render_page' )
			? 'jetpack_activity_log_jetpack_activity_log_dashboard_wp_admin_render_page'
			: array( __CLASS__, 'render_fallback' );

		$page_suffix = Admin_Menu::add_menu(
			/** "Activity Log" is a product name, do not translate. */
			'Activity Log',
			'Activity Log',
			'manage_options',
			self::PAGE_SLUG,
			$render_callback,
			12
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}

		return $page_suffix;
	}

	/**
	 * Whether the Activity Log page should be shown to the current user.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( is_multisite() ) {
			return false;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return ( new Connection_Manager() )->is_user_connected();
	}

	/**
	 * Fires when the admin page is loaded.
	 *
	 * When the user is returning from a successful checkout, the upsell
	 * CTA appends `?refresh_access=1&_wpnonce=…` to the `redirect_to`
	 * value it hands off to WordPress.com. Detect that here, verify the
	 * nonce, and drop the cached paid-plan signal so
	 * `Initial_State::get_data()` (which runs later in the same request,
	 * when the bundle is enqueued) rehydrates from WPCOM instead of
	 * re-serving the pre-checkout value. Mirrors the pattern in
	 * `Automattic\Jetpack\Publicize\Social_Admin_Page::admin_init()`.
	 */
	public static function admin_init() {
		if ( isset( $_GET['refresh_access'] ) && isset( $_GET['_wpnonce'] ) ) {
			$nonce = sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) );
			if ( wp_verify_nonce( $nonce, self::REFRESH_ACCESS_NONCE_ACTION ) ) {
				REST_Controller::clear_access_cache();
			}
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_initial_state' ) );
	}

	/**
	 * Require the generated wp-build entry and register the script/module
	 * polyfills the boot bundle depends on.
	 *
	 * The boot bundle depends on `@wordpress/*` handles (e.g. `wp-theme`,
	 * pulled in via `@wordpress/ui`) that Core does not register on older
	 * WordPress versions. Without them WP_Scripts silently drops the bundle
	 * and the page renders blank, so register the polyfills here. Scoped to
	 * the Activity Log request by the sole caller, since the register() call
	 * can force-replace Core handles and must not fire on every admin page.
	 *
	 * @return void
	 */
	private static function load_wp_build() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		// The generated `modules.php` registers standalone script modules (the
		// `@jetpack-activity-log/init` i18n bootstrap) on `wp_default_scripts`.
		// We load wp-build lazily on `admin_menu`, which can run after that
		// action has already fired — so the hook may be added too late and the
		// init module never registers, leaving it out of the import map and
		// breaking boot. Register directly here (mirroring the polyfills call
		// below); the generated function guards against double-registration.
		if ( function_exists( 'jetpack_activity_log_register_script_modules' ) ) {
			jetpack_activity_log_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		WP_Build_Polyfills::register(
			'jetpack-activity-log',
			array_merge(
				WP_Build_Polyfills::SCRIPT_HANDLES,
				WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Alias the current screen id to the wp-build page slug.
	 *
	 * The wp-build-generated enqueue callback only fires when the screen id
	 * equals the wp-build page slug. Our menu slug stays `jetpack-activity-log`,
	 * so alias the screen id in place to make the check pass without changing
	 * the user-facing URL. Hooked on `current_screen` only for the Activity Log
	 * request, so this never affects any other screen.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( is_object( $screen ) ) {
			$screen->id = self::WP_BUILD_PAGE_SLUG;
		}
	}

	/**
	 * Print the React initial state and the Connection initial state, and load
	 * the Tracks transport.
	 *
	 * The initial state is attached to a dedicated empty classic handle because
	 * the dashboard is a wp-build script module — there is no classic bundle
	 * handle to hang the inline data on. Boot defers its own execution to
	 * `DOMContentLoaded`, so this inline data is always set on `window` first.
	 *
	 * `jp-tracks` (stats.wp.com/w.js) is required for analytics: the dashboard's
	 * `@automattic/jetpack-analytics` events only queue into `window._tkq`
	 * (the package's own w.js loader is disabled), so without this handle no
	 * `jetpack_activity_log_*` event ever flushes. Mirrors Newsletter's
	 * `Settings::load_admin_scripts()`.
	 *
	 * @return void
	 */
	public static function enqueue_initial_state() {
		wp_register_script( self::DATA_SCRIPT_HANDLE, false, array(), Package_Version::PACKAGE_VERSION, true );
		wp_enqueue_script( self::DATA_SCRIPT_HANDLE );

		wp_add_inline_script( self::DATA_SCRIPT_HANDLE, ( new Activity_Log_Initial_State() )->render(), 'before' );
		Connection_Initial_State::render_script( self::DATA_SCRIPT_HANDLE );

		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );

		// The dashboard is a wp-build script module: it externalizes
		// `@wordpress/i18n` to the shared `wp.i18n` global but has no
		// `wp_set_script_translations()` equivalent to load its JS catalog.
		// Enqueue Jetpack's i18n loader (`wp.jpI18nLoader`, from jetpack-assets,
		// registered on `wp_default_scripts`) so the `@jetpack-activity-log/init`
		// boot module can fetch and install the translation catalog before the
		// app renders. Without this the UI ships in English on non-English sites.
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Fallback page body if the generated wp-build render function is
	 * unavailable (e.g. assets not built). Keeps the menu from fataling and
	 * still gives boot its mount container.
	 *
	 * @return void
	 */
	public static function render_fallback() {
		echo '<div class="wrap"><div id="jetpack-activity-log-dashboard-wp-admin-app"></div></div>';
	}

	/**
	 * Whether the current request targets the Activity Log admin page.
	 *
	 * The `$_GET['page']` value is populated by wp-admin/admin.php before any
	 * of our hooks fire, so this check is reliable from `admin_menu` onwards.
	 *
	 * @return bool
	 */
	private static function is_activity_log_admin_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === self::PAGE_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Register the REST routes backing the Activity Log UI.
	 *
	 * Routes are added in Phase 2. This method exists now so that the
	 * `jetpack/v4/activity-log` namespace is reserved and the hook is wired.
	 */
	public static function register_rest_routes() {
		REST_Controller::register_rest_routes();
	}
}
