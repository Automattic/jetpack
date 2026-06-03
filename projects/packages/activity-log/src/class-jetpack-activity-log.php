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
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use function add_action;
use function add_filter;
use function current_user_can;
use function did_action;
use function do_action;
use function is_multisite;
use function sanitize_text_field;
use function wp_add_inline_script;
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
	 * Script handle for the admin bundle.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-activity-log';

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

		$page_suffix = Admin_Menu::add_menu(
			/** "Activity Log" is a product name, do not translate. */
			'Activity Log',
			'Activity Log',
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' ),
			14
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- verified with wp_verify_nonce below.
		if ( isset( $_GET['refresh_access'] ) && isset( $_GET['_wpnonce'] ) ) {
			$nonce = sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) );
			if ( wp_verify_nonce( $nonce, self::REFRESH_ACCESS_NONCE_ACTION ) ) {
				REST_Controller::clear_access_cache();
			}
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue the admin bundle and seed initial state.
	 */
	public static function enqueue_admin_scripts() {
		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../build/index.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-activity-log',
			)
		);
		Assets::enqueue_script( self::SCRIPT_HANDLE );

		wp_add_inline_script( self::SCRIPT_HANDLE, ( new Activity_Log_Initial_State() )->render(), 'before' );
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );
	}

	/**
	 * Render the admin page root node. React mounts into this element.
	 */
	public static function render_page() {
		?>
			<div id="jetpack-activity-log-root"></div>
		<?php
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
