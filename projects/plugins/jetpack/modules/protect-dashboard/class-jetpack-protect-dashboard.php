<?php
/**
 * Protect dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Protect_Status\Plan;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-wp-build-page.php';
require_once __DIR__ . '/interface-jetpack-protect-dashboard-section.php';
require_once __DIR__ . '/class-jetpack-protect-dashboard-threats.php';

/**
 * Registers the Protect sidebar item and renders its wp-build route.
 *
 * @since $$next-version$$
 */
class Jetpack_Protect_Dashboard {

	/**
	 * Sidebar menu slug, shared with the Jetpack Protect plugin so the page address never changes.
	 *
	 * @var string
	 */
	const MENU_SLUG = 'jetpack-protect';

	/**
	 * The wp-build route's page id, which must not be the menu slug.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-protect-hub';

	/**
	 * Registered sections, keyed by section key.
	 *
	 * @var Jetpack_Protect_Dashboard_Section[]
	 */
	private static $sections = array();

	/**
	 * Wire the hooks. Runs only while the `protect-dashboard` module is active.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		// Before Admin_Menu registers its items at 1000, and after the Protect plugin adds its own on `_admin_menu`.
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ), 999 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

		// Each feature lives in its own file and registers itself, so features can land independently.
		$section_files = glob( __DIR__ . '/sections/class-*.php' );
		foreach ( is_array( $section_files ) ? $section_files : array() as $section_file ) {
			require_once $section_file;
		}
	}

	/**
	 * Add a section to the dashboard.
	 *
	 * @param Jetpack_Protect_Dashboard_Section $section The section.
	 * @return void
	 */
	public static function register_section( Jetpack_Protect_Dashboard_Section $section ) {
		$key = $section->get_key();
		if ( isset( self::$sections[ $key ] ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s is a dashboard section key. */
				esc_html( sprintf( __( 'A Protect dashboard section with the key "%s" is already registered.', 'jetpack' ), $key ) ),
				'$$next-version$$'
			);
			return;
		}
		self::$sections[ $key ] = $section;
	}

	/**
	 * Register every section's REST routes.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		foreach ( self::$sections as $section ) {
			$section->register_routes();
		}
	}

	/**
	 * Each section's state, keyed by section key.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$state = array();
		foreach ( self::$sections as $key => $section ) {
			$state[ $key ] = $section->get_state();
		}
		return $state;
	}

	/**
	 * Whether the current user may see and use the dashboard's REST routes.
	 *
	 * @return bool
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Whether the site has a plan that includes Scan.
	 *
	 * @return bool
	 */
	public static function has_scan_plan() {
		return class_exists( Plan::class ) && Plan::has_required_plan();
	}

	/**
	 * Whether a module can run on this site, and whether it is on.
	 *
	 * @param string $module Module slug.
	 * @return array
	 */
	public static function get_module_state( $module ) {
		$modules = new Modules();

		return array(
			'available' => $modules->is_module( $module ),
			'active'    => $modules->is_active( $module ),
		);
	}

	/**
	 * Load wp-build output, only on this page's request.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		if ( isset( $_GET['page'] ) && self::MENU_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) {
			Jetpack_WP_Build_Page::load( self::WP_BUILD_PAGE_ID );
		}
	}

	/**
	 * Add the "Protect" item to the Jetpack sidebar, in place of the Jetpack Protect plugin's.
	 *
	 * @return void
	 */
	public static function add_menu() {
		// Take the slug over from the Jetpack Protect plugin: drop its item and the scripts it loads for that page.
		while ( Admin_Menu::remove_menu( self::MENU_SLUG ) ) {
			continue;
		}
		remove_all_actions( 'load-jetpack_page_' . self::MENU_SLUG );
		remove_all_actions( 'load-admin_page_' . self::MENU_SLUG );

		Admin_Menu::add_menu(
			// "Protect" is a product name and is not translated.
			'Protect',
			'Protect',
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' ),
			null,
			array(
				'module' => Jetpack_Protect_Dashboard_Feature_Flags::MODULE,
				'key'    => self::MENU_SLUG,
			)
		);
	}

	/**
	 * Render the wp-build page, or say why it could not be rendered.
	 *
	 * @return void
	 */
	public static function render() {
		$render_fn = 'jetpack_plugin_' . str_replace( '-', '_', self::WP_BUILD_PAGE_ID ) . '_wp_admin_render_page';
		if ( function_exists( $render_fn ) ) {
			$state = wp_json_encode( (object) self::get_initial_state(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
			wp_print_inline_script_tag( 'window.jetpackProtectDashboard = ' . ( false === $state ? '{}' : $state ) . ';' );
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>Protect</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'The Protect dashboard could not be loaded because its assets are missing.', 'jetpack' )
		);
	}
}
