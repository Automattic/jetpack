<?php
/**
 * Send dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the Send sidebar item and renders its wp-build routes.
 */
class Admin_Page {

	/**
	 * Sidebar menu slug.
	 *
	 * @var string
	 */
	const MENU_SLUG = 'jetpack-send';

	/**
	 * The wp-build page id. It must not be the menu slug: the generated
	 * standalone page.php intercepts `admin_init` for its own id and exits.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-send-dashboard';

	/**
	 * Name of the wp-build render function generated for WP_BUILD_PAGE_ID.
	 *
	 * @var string
	 */
	const RENDER_FUNCTION = 'jetpack_send_jetpack_send_dashboard_wp_admin_render_page';

	/**
	 * Key the dashboard reads from `window.JetpackScriptData`.
	 *
	 * @var string
	 */
	const SCRIPT_DATA_KEY = 'send';

	/**
	 * The screen ID alias_screen_id() replaced, until it is restored.
	 *
	 * @var string|null
	 */
	private static $original_screen_id = null;

	/**
	 * The screen the JITM opt-out applies to.
	 *
	 * @var string|null
	 */
	private static $jitm_opt_out_screen_id = null;

	/**
	 * Wire the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );
	}

	/**
	 * The dashboard URL.
	 *
	 * @return string
	 */
	public static function dashboard_url() {
		return admin_url( 'admin.php?page=' . self::MENU_SLUG );
	}

	/**
	 * Load wp-build output, only on this page's request, so polyfills never replace core scripts elsewhere.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_dashboard_request() ) {
			return;
		}

		self::load_wp_build( dirname( __DIR__ ) . '/build/build.php' );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'inject_script_data' ) );
	}

	/**
	 * Whether the request is for the dashboard's page.
	 *
	 * @return bool
	 */
	public static function is_dashboard_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		return is_admin() && isset( $_GET['page'] ) && self::MENU_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Load a wp-build index and, if it can render the page, its scripts and polyfills.
	 *
	 * @param string $build_index Path to the generated build.php.
	 * @return bool Whether the build can render the page.
	 */
	public static function load_wp_build( $build_index ) {
		if ( ! file_exists( $build_index ) ) {
			return false;
		}

		$load_wp_build = static function () use ( $build_index ) {
			require_once $build_index;
		};

		// Fallback: an older wp-build-polyfills under the jetpack-autoloader may predate load_with_alias().
		if ( method_exists( WP_Build_Screen_Id::class, 'load_with_alias' ) ) {
			WP_Build_Screen_Id::load_with_alias(
				array( __CLASS__, 'alias_screen_id' ),
				array( __CLASS__, 'restore_screen_id' ),
				$load_wp_build
			);
		} else {
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id' ) );
			$load_wp_build();
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id' ) );
		}

		// A stale or partial build can't render the page, so don't swap core's scripts for it.
		if ( ! function_exists( self::RENDER_FUNCTION ) ) {
			return false;
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );

		// wp-build hooks module registration to wp_default_scripts, which has already fired by admin_menu.
		if ( function_exists( 'jetpack_send_register_script_modules' ) ) {
			jetpack_send_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		WP_Build_Polyfills::register(
			'jetpack-send',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		return true;
	}

	/**
	 * Point the screen ID at the wp-build page while its generated enqueue check runs.
	 *
	 * @return void
	 */
	public static function alias_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return;
		}

		self::$original_screen_id = $screen->id;
		$screen->id               = self::WP_BUILD_PAGE_ID;
	}

	/**
	 * Undo alias_screen_id(), since JITM builds its message path from the screen ID.
	 *
	 * @return void
	 */
	public static function restore_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$original_screen_id ) {
			return;
		}

		$screen->id               = self::$original_screen_id;
		self::$original_screen_id = null;
	}

	/**
	 * Enqueue the JS translation loader, which the esbuild route bundles don't pull in.
	 *
	 * @return void
	 */
	public static function enqueue_i18n_loader() {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Add the "Send" item to the Jetpack sidebar; with no position it sorts alphabetically.
	 *
	 * @return void
	 */
	public static function add_menu() {
		$page_suffix = Admin_Menu::add_menu(
			// "Jetpack Send" and "Send" are product names and are not translated.
			'Jetpack Send',
			'Send',
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' ),
			null,
			array( 'key' => self::MENU_SLUG )
		);

		if ( $page_suffix ) {
			self::$jitm_opt_out_screen_id = $page_suffix;
			add_filter( 'jetpack_display_jitms_on_screen', array( __CLASS__, 'hide_jitms_on_dashboard' ), 10, 2 );
		}
	}

	/**
	 * Keep JITMs off the dashboard, which has no `#jp-admin-notices` to show them in.
	 *
	 * @param bool   $show      Whether to show JITMs on the screen.
	 * @param string $screen_id The screen ID.
	 * @return bool
	 */
	public static function hide_jitms_on_dashboard( $show, $screen_id ) {
		if ( null !== self::$jitm_opt_out_screen_id && self::$jitm_opt_out_screen_id === $screen_id ) {
			return false;
		}

		return $show;
	}

	/**
	 * Preload the dashboard's REST reads onto `window.JetpackScriptData.send`.
	 *
	 * @param array $data Script data being injected onto the page.
	 * @return array
	 */
	public static function inject_script_data( $data ) {
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		$data[ self::SCRIPT_DATA_KEY ] = array(
			'preload' => array_reduce( self::preload_paths(), 'rest_preload_api_request', array() ),
		);

		return $data;
	}

	/**
	 * REST paths preloaded onto the page.
	 *
	 * @return string[]
	 */
	public static function preload_paths() {
		return array( REST_Controller::STATUS_PATH );
	}

	/**
	 * Render the wp-build page, or say why it could not be rendered.
	 *
	 * @return void
	 */
	public static function render() {
		$render_fn = self::RENDER_FUNCTION;
		if ( function_exists( $render_fn ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Checked with function_exists(); defined in the generated build/, which Phan excludes.
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>Jetpack Send</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'The Send dashboard could not be loaded because its assets are missing.', 'jetpack-send-pkg' )
		);
	}
}
