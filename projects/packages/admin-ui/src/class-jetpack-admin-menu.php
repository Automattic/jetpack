<?php
/**
 * Admin Menu Registration
 */

namespace Automattic\Jetpack;

class Admin_Menu {

	private static $initialized = false;

	private static $menu_items = array();

	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			add_action( 'admin_menu', array( __CLASS__, 'admin_menu_hook_callback' ), 1000 ); // Jetpack uses 998.
		}
	}

	public static function enqueue_style() {
		wp_enqueue_style(
			'jetpack-admin-ui',
			plugin_dir_url( __FILE__ ) . 'css/jetpack-icon.css'
		);
	}

	public static function admin_menu_hook_callback() {
		global $submenu;

		$can_see_menu = true;

		if ( ! isset( $submenu['jetpack'] ) ) {
			add_action( 'admin_print_scripts', array( __CLASS__, 'enqueue_style' ) );
			add_menu_page(
				'Jetpack',
				'Jetpack',
				'read',
				'jetpack',
				'__return_null',
				'div',
				3
			);
			// If Jetpack plugin is not present, user will only be able to see this menu if he has enough capability to at least one of the sub menus being added.
			$can_see_menu = false;
		}

		foreach ( self::$menu_items as $menu_item ) {
			if ( ! current_user_can( $menu_item['capability'] ) ) {
				continue;
			}

			$can_see_menu = true;

			add_submenu_page(
				'jetpack',
				$menu_item['page_title'],
				$menu_item['menu_title'],
				$menu_item['capability'],
				$menu_item['menu_slug'],
				$menu_item['function'],
				$menu_item['position']
			);
		}

		remove_submenu_page( 'jetpack', 'jetpack' );

		if ( ! $can_see_menu ) {
			remove_menu_page( 'jetpack' );
		}
	}

	public static function add_menu( $page_title, $menu_title, $capability, $menu_slug, $function, $position = null ) {
		self::init();
		self::$menu_items[] = compact( 'page_title', 'menu_title', 'capability', 'menu_slug', 'function', 'position' );

		/**
		 * Let's return the page hook so consumers can use.
		 * We know all pages will be under Jetpack top level menu page, so we can hardcode the first part of the string.
		 * Using get_plugin_page_hookname here won't work because the top level page is not registered yet.
		 */
		return 'jetpack_page_' . $menu_slug;
	}

}
