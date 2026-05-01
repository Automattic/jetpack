<?php
/**
 * Primary class for the Jetpack Scan package.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use function add_action;
use function add_filter;
use function apply_filters;
use function current_user_can;
use function did_action;
use function do_action;
use function is_multisite;
use function wp_add_inline_script;

/**
 * Class Jetpack_Scan
 *
 * Registers the Scan admin page and its REST routes inside the main
 * Jetpack plugin.
 */
class Jetpack_Scan {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	const PAGE_SLUG = 'jetpack-scan';

	/**
	 * Script handle for the admin bundle.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-scan-page';

	/**
	 * Filter name that gates the wp-build–based Scan dashboard.
	 *
	 * When this filter returns true, the new wp-admin Scan page is
	 * registered and rendered. Default false during the modernization
	 * roll-out — the package registers no admin menu and changes
	 * nothing about the existing Jetpack UI when this filter is off.
	 *
	 * @var string
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_scan';

	/**
	 * Entry point. Idempotent: safe to call from multiple bootstraps.
	 */
	public static function initialize() {
		if ( did_action( 'jetpack_scan_page_initialized' ) ) {
			return;
		}

		if ( ! (bool) apply_filters( self::MODERNIZATION_FILTER, false ) ) {
			return;
		}

		add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_filter( 'jetpack_package_versions', array( Package_Version::class, 'send_package_version_to_tracker' ) );

		/**
		 * Fires once the Jetpack Scan package has wired its hooks.
		 *
		 * @since 0.1.0
		 */
		do_action( 'jetpack_scan_page_initialized' );
	}

	/**
	 * Register the Scan submenu under Jetpack.
	 *
	 * @return string|null The resulting page's hook suffix, if registered.
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::is_available() ) {
			return null;
		}

		$page_suffix = Admin_Menu::add_menu(
			/** "Scan" is a product name, do not translate. */
			'Scan',
			'Scan',
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' ),
			6
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}

		return $page_suffix;
	}

	/**
	 * Whether the Scan page should be shown to the current user.
	 *
	 * Mirrors the gating used by Activity Log: connected admin on a
	 * single-site install. Plan gating happens client-side (and via
	 * REST 403s) so the page can render its own "no plan" upsell.
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
	 */
	public static function admin_init() {
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
				'textdomain' => 'jetpack-scan-page',
			)
		);
		Assets::enqueue_script( self::SCRIPT_HANDLE );

		wp_add_inline_script( self::SCRIPT_HANDLE, ( new Initial_State() )->render(), 'before' );
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );
	}

	/**
	 * Render the admin page root node. React mounts into this element.
	 */
	public static function render_page() {
		?>
			<div id="jetpack-scan-page-root"></div>
		<?php
	}

	/**
	 * Register the REST routes backing the Scan UI.
	 */
	public static function register_rest_routes() {
		REST_Controller::register_rest_routes();
	}
}
