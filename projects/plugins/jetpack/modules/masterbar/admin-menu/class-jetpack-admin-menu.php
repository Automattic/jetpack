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
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		parent::add_jetpack_menu();

		add_submenu_page( 'https://wordpress.com/activity-log/' . $this->domain, esc_attr__( 'Scan', 'jetpack' ), __( 'Scan', 'jetpack' ), 'manage_options', 'https://wordpress.com/scan/' . $this->domain, null, 2 );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin_customize = false, $wp_admin_themes = false ) {
		// Customize on Jetpack sites is always handled on WP Admin.
		parent::add_appearance_menu( true, $wp_admin_themes );
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
}
