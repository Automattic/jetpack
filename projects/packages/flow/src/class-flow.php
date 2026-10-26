<?php
/**
 * Jetpack Flow bootstrap.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the Flow engine, REST API and WP Build dashboard.
 */
class Flow {

	const PACKAGE_VERSION = '0.1.0-alpha';

	const MENU_PAGE_SLUG = 'jetpack-flow-wp-admin';

	/**
	 * Initialized flag.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Start Flow. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		Engine::init();
		REST_Controller::init();

		if ( is_admin() ) {
			add_action( 'admin_menu', array( __CLASS__, 'register_admin_menu' ) );
			self::load_build();
		}
	}

	/**
	 * Capability check shared by the menu and REST routes.
	 *
	 * @return bool
	 */
	public static function current_user_can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * URL of the dashboard.
	 *
	 * @return string
	 */
	public static function dashboard_url() {
		return admin_url( 'admin.php?page=' . self::MENU_PAGE_SLUG );
	}

	/**
	 * Whether this request renders the dashboard.
	 *
	 * @return bool
	 */
	public static function is_dashboard_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only scopes asset loading.
		return is_admin() && isset( $_GET['page'] ) && self::MENU_PAGE_SLUG === sanitize_key( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Load the generated WP Build entry point on the dashboard page only.
	 *
	 * @return void
	 */
	private static function load_build() {
		if ( ! self::is_dashboard_request() ) {
			return;
		}

		$entry = __DIR__ . '/../build/build.php';
		if ( file_exists( $entry ) ) {
			require_once $entry;
		}

		// Polyfills replace core handles on WP < 7.0, so scope them to this page.
		WP_Build_Polyfills::register(
			'jetpack-flow-pkg',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);
	}

	/**
	 * Add the "Flow" sidebar item.
	 *
	 * @return void
	 */
	public static function register_admin_menu() {
		$callback = function_exists( 'jetpack_flow_jetpack_flow_wp_admin_render_page' )
			? 'jetpack_flow_jetpack_flow_wp_admin_render_page'
			: array( __CLASS__, 'render_missing_build_notice' );

		$title = __( 'Flow', 'jetpack-flow-pkg' );

		if ( ! method_exists( Admin_Menu::class, 'add_top_level_menu' ) ) {
			add_menu_page( $title, $title, 'manage_options', self::MENU_PAGE_SLUG, $callback, 'dashicons-randomize', 3 );
			return;
		}

		Admin_Menu::add_top_level_menu( $title, $title, 'manage_options', self::MENU_PAGE_SLUG, $callback, 'dashicons-randomize', 3, array( 'key' => 'jetpack-flow-pkg' ) );
	}

	/**
	 * Explain why the page is empty when the JS build is absent.
	 *
	 * @return void
	 */
	public static function render_missing_build_notice() {
		echo '<div class="wrap"><h1>' . esc_html__( 'Flow', 'jetpack-flow-pkg' ) . '</h1><p>'
			. esc_html__( 'The Flow dashboard has not been built. Run "jp build packages/flow".', 'jetpack-flow-pkg' )
			. '</p></div>';
	}
}
