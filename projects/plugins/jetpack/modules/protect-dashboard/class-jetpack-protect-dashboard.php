<?php
/**
 * Protect dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-wp-build-page.php';

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
	 * Wire the hooks. Runs only while the `protect-dashboard` module is active.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		// Before Admin_Menu registers its items at 1000, and after the Protect plugin adds its own on `_admin_menu`.
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ), 999 );
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
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>Protect</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'The Protect dashboard could not be loaded because its assets are missing.', 'jetpack' )
		);
	}
}
