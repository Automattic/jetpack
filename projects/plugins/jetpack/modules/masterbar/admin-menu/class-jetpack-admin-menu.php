<?php
/**
 * Jetpack Admin Menu file.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class Jetpack_Admin_Menu.
 */
class Jetpack_Admin_Menu extends Admin_Menu {

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();

		$this->add_wp_admin_menu();

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		parent::add_jetpack_menu();

		$parent_slug = 'https://wordpress.com/activity-log/' . $this->domain;

		// Place "Scan" submenu after Backup.
		$position = 0;
		global $submenu;
		foreach ( $submenu[ $parent_slug ] as $submenu_item ) {
			$position++;
			if ( __( 'Backup', 'jetpack' ) === $submenu_item[3] ) {
				break;
			}
		}
		add_submenu_page( $parent_slug, esc_attr__( 'Scan', 'jetpack' ), __( 'Scan', 'jetpack' ), 'manage_options', 'https://wordpress.com/scan/' . $this->domain, null, $position );
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin_import Optional. Whether Import link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_export Optional. Whether Export link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin_import = false, $wp_admin_export = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Import/Export on Jetpack sites is always handled on WP Admin.
		parent::add_tools_menu( true, true );
	}

	/**
	 * Adds WP Admin menu.
	 */
	public function add_wp_admin_menu() {
		global $menu;
		$menu_slug = 'index.php';

		remove_menu_page( $menu_slug );
		remove_submenu_page( $menu_slug, $menu_slug );
		remove_submenu_page( $menu_slug, 'update-core.php' );

		// Attempt to get last position.
		ksort( $menu );
		end( $menu );
		$position = key( $menu );

		$this->add_admin_menu_separator( ++$position );

		add_menu_page( __( 'WP Admin', 'jetpack' ), __( 'WP Admin', 'jetpack' ), 'read', $menu_slug, null, 'dashicons-wordpress-alt', $position );
	}
}
