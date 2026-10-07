<?php
/**
 * Protect dashboard: a wp-build page that gathers Jetpack's security modules and Scan.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Scan_Page\Initial_State as Scan_Initial_State;
use Automattic\Jetpack\Scan_Page\Jetpack_Scan;
use Automattic\Jetpack\Waf\Waf_Stats;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-wp-build-page.php';

/**
 * Registers the Protect sidebar item and renders its wp-build route.
 */
class Jetpack_Protect_Dashboard {

	/**
	 * Sidebar menu slug.
	 *
	 * @var string
	 */
	const MENU_SLUG = 'jetpack-protect-dashboard';

	/**
	 * The wp-build route's page id, which must not be the menu slug.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-protect-hub';

	/**
	 * Wire the hooks. Runs only while the `protect-dashboard` module is active.
	 *
	 * @return void
	 */
	public static function init() {
		// Module files load on plugins_loaded, before admin_menu, so priority 1 still fires.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );

		// The Scan tab reuses packages/scan's endpoints, which only register behind its own filter.
		if ( class_exists( Jetpack_Scan::class ) ) {
			add_action( 'rest_api_init', array( Jetpack_Scan::class, 'register_rest_routes' ) );
		}
	}

	/**
	 * Load wp-build output, only on this page's request.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		if ( is_admin() && isset( $_GET['page'] ) && self::MENU_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) {
			Jetpack_WP_Build_Page::load( self::WP_BUILD_PAGE_ID );
		}
	}

	/**
	 * Add the "Protect" item to the Jetpack sidebar.
	 *
	 * @return void
	 */
	public static function add_menu() {
		Admin_Menu::add_menu(
			// "Protect" is a product name and is not translated.
			'Protect',
			'Protect',
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' ),
			null,
			array(
				'module' => 'protect-dashboard',
				'key'    => self::MENU_SLUG,
			)
		);
	}

	/**
	 * Data with no REST endpoint: what a scan covers, and the firewall's block counts.
	 *
	 * @return array
	 */
	private static function get_bootstrap() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$blocked = null;
		if ( class_exists( Waf_Stats::class ) && ( new Modules() )->is_active( 'waf' ) ) {
			$blocked = Waf_Stats::get_blocked_requests();
		}

		return array(
			'counts'         => array(
				'plugins'   => count( get_plugins() ),
				'themes'    => count( wp_get_themes() ),
				'wpVersion' => get_bloginfo( 'version' ),
			),
			'firewallBlocks' => $blocked,
		);
	}

	/**
	 * Render the wp-build page, with the site bootstrap the reused Scan components read.
	 *
	 * @return void
	 */
	public static function render() {
		if ( class_exists( Scan_Initial_State::class ) ) {
			wp_print_inline_script_tag( ( new Scan_Initial_State() )->render() );
		}
		wp_print_inline_script_tag(
			'var JP_PROTECT_DASHBOARD=' . wp_json_encode( self::get_bootstrap(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';'
		);

		$render_fn = 'jetpack_plugin_' . str_replace( '-', '_', self::WP_BUILD_PAGE_ID ) . '_wp_admin_render_page';
		if ( function_exists( $render_fn ) ) {
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>Protect</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'The Protect dashboard could not be loaded because its assets are missing.', 'jetpack' )
		);
	}
}
