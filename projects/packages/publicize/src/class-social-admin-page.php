<?php
/**
 * Social Admin Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use Automattic\Jetpack\Status\Host;

/**
 * The class to handle the Social Admin Page.
 */
class Social_Admin_Page {

	/**
	 * Nonce action used when refreshing plan data.
	 */
	public const REFRESH_PLAN_NONCE_ACTION = 'jetpack_social_refresh_plan_data';

	/**
	 * Filter name that gates the wp-build–based dashboard.
	 *
	 * When this filter returns true, "Jetpack > Social" renders the new
	 * wp-build dashboard (Overview + Settings tabs) instead of the legacy
	 * single-page React app.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_social';

	/**
	 * The instance of the class.
	 *
	 * @var Social_Admin_Page
	 */
	private static $instance;

	/**
	 * Initialize the class.
	 *
	 * @return Social_Admin_Page
	 */
	public static function init() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * The constructor.
	 */
	private function __construct() {
		// Defer wp-build loading to admin_menu (priority 1) so the modernization
		// filter — which third parties typically register from a plugins_loaded
		// or init callback (e.g. via Code Snippets) — has been applied before we
		// read it, and so the wp-build render function is defined before
		// `add_menu` (priority 10) reads `function_exists()`.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		add_action( 'admin_menu', array( $this, 'add_menu' ) );
	}

	/**
	 * Load wp-build for the Social admin page when modernization is enabled.
	 *
	 * Hooked to `admin_menu` priority 1 so the modernization filter has been
	 * registered by any opt-in code (mu-plugins, snippets, themes) before we
	 * read it, and so the wp-build render function and enqueue hook are in
	 * place before `add_menu()` runs at the default priority.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_modernized() || ! self::is_social_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
	}

	/**
	 * Add the admin menu.
	 */
	public function add_menu() {

		// Remove the old Social menu item, if it exists.
		Admin_Menu::remove_menu( 'jetpack-social' );

		// If this isn't an admin (or someone with the capability to change the module status )
		// and Publicize is inactive, then don't render the admin page.
		if ( ! current_user_can( 'manage_options' ) && ! Utils::is_publicize_active() ) {
			return;
		}

		// We don't need Jetpack connection on WP.com.
		$needs_site_connection = ! ( new Host() )->is_wpcom_platform() && ! ( new Connection_Manager() )->is_connected();

		/**
		 * If the Jetpack Social plugin is not active,
		 * we want to hide the menu if the site is not connected.
		 */
		if ( ! defined( 'JETPACK_SOCIAL_PLUGIN_DIR' ) && $needs_site_connection ) {
			return;
		}

		$callback = self::is_wp_build_dashboard_active()
			? 'jetpack_social_jetpack_social_dashboard_wp_admin_render_page'
			: array( $this, 'render' );

		$page_suffix = Admin_Menu::add_menu(
			/** "Jetpack Social" is a product name, do not translate. */
			'Jetpack Social',
			'Social',
			'publish_posts',
			'jetpack-social',
			$callback,
			4
		);

		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		// Refresh data if coming from purchase to ensure it is up to date
		// without making API calls on every admin page load.
		if ( isset( $_GET['refresh_plan_data'] ) ) {
			check_admin_referer( self::REFRESH_PLAN_NONCE_ACTION );
			if ( apply_filters( 'jetpack_social_should_refresh_plan_data', true ) ) {
				Current_Plan::refresh_from_wpcom();
			}
		}

		/**
		 * Use priority 20 to ensure that we can dequeue the old Social assets.
		 */
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ), 20 );

		// Initialize the media library for the social image generator.
		wp_enqueue_media();
	}

	/**
	 * Render the admin page.
	 */
	public function render() {
		?>
			<div id="jetpack-social-root"></div>
		<?php
	}

	/**
	 * Enqueue admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		// This callback is registered via `load-{$page_suffix}` in `add_menu()`,
		// so it only fires on the Social admin page — no need to re-check the page here.
		//
		// Gate on `is_wp_build_dashboard_active()` (not `is_modernized()` alone) so
		// this mirrors the exact decision `add_menu()` made when choosing the menu
		// callback: when modernization is on AND the wp-build render function is defined
		// (i.e. the chassis was actually loaded), skip the legacy bundle entirely.
		if ( self::is_wp_build_dashboard_active() ) {
			// wp-build manages its own enqueue pipeline. The legacy script,
			// localized config, and media-library bootstrap are intentionally
			// skipped here.
			//
			// The chassis reads site-connection state via `useConnection()`, whose
			// store has no REST resolver — it must be hydrated inline. The wp-build
			// boot registers a classic `…-prerequisites` script that loads before the
			// chassis module, so attach the connection initial state there.
			if ( wp_script_is( 'jetpack-social-dashboard-wp-admin-prerequisites', 'registered' ) ) {
				Connection_Initial_State::render_script( 'jetpack-social-dashboard-wp-admin-prerequisites' );
			}
			return;
		}

		// Dequeue the old Social assets.
		wp_dequeue_script( 'jetpack-social' );
		wp_dequeue_style( 'jetpack-social' );

		Assets::register_script(
			'social-admin-page',
			'../build/social-admin-page.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-publicize-pkg',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Load the wp-build entry file and register its polyfills.
	 *
	 * Only called on `?page=jetpack-social` admin requests when the
	 * modernization filter is enabled. Keeps wp-build off every other request.
	 *
	 * @return void
	 */
	private static function load_wp_build() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		if ( ! class_exists( '\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills' ) ) {
			return;
		}

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-social',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Alias the current screen ID to satisfy wp-build's auto-generated enqueue check.
	 *
	 * The wp-build `<page>-wp-admin` enqueue callback fires only when the screen ID
	 * matches the wp-build page slug (`jetpack-social-dashboard`). Our wp-admin menu
	 * slug stays `jetpack-social`, so we mutate the screen object in place to make
	 * the check pass without changing the user-facing URL.
	 *
	 * Hooked only when modernization is on AND we're on the Social admin page,
	 * so this never affects any other request.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = 'jetpack-social-dashboard';
	}

	/**
	 * Returns true when the wp-build modernization filter is enabled.
	 *
	 * @return bool
	 */
	private static function is_modernized() {
		return (bool) apply_filters( self::MODERNIZATION_FILTER, false );
	}

	/**
	 * Returns true when the wp-build dashboard is the page that will actually render.
	 *
	 * This is the single source of truth shared by `add_menu()` (which picks the
	 * menu callback) and `enqueue_admin_scripts()` (which decides whether to skip
	 * the legacy bundle). `maybe_load_wp_build()` only loads the wp-build entry —
	 * and therefore only defines its render function — when modernization is on AND
	 * we are on the Social admin page. Checking `function_exists()` here captures
	 * both conditions in one place, so the callback and the enqueue gate can never
	 * diverge and leave an empty `#jetpack-social-root`.
	 *
	 * @return bool
	 */
	private static function is_wp_build_dashboard_active() {
		return self::is_modernized() && function_exists( 'jetpack_social_jetpack_social_dashboard_wp_admin_render_page' );
	}

	/**
	 * Returns true when the current request targets the Social admin page.
	 *
	 * Used to scope wp-build loading to the one page that needs it. The
	 * `$_GET['page']` value is populated by wp-admin/admin.php before any of
	 * our hooks fire, so this check is reliable from the constructor onwards.
	 *
	 * @return bool
	 */
	private static function is_social_admin_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === 'jetpack-social'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}
