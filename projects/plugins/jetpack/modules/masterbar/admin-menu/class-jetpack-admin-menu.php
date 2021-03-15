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
		global $menu, $submenu;

		if ( $this->is_api_request || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			// Reset menus for API requests (i.e. Calypso) so there are no third-party plugin items.
			$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}

		parent::reregister_menu_items();

		$this->add_feedback_menu();
		$this->add_wp_admin_menu();

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		parent::add_jetpack_menu();

		// Place "Scan" submenu after Backup.
		$position = 0;
		global $submenu;
		foreach ( $submenu['jetpack'] as $submenu_item ) {
			$position++;
			if ( __( 'Backup', 'jetpack' ) === $submenu_item[3] ) {
				break;
			}
		}
		add_submenu_page( 'jetpack', esc_attr__( 'Scan', 'jetpack' ), __( 'Scan', 'jetpack' ), 'manage_options', 'https://wordpress.com/scan/' . $this->domain, null, $position );
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin_import Optional. Whether Import link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_export Optional. Whether Export link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin_import = false, $wp_admin_export = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->remove_submenus( 'tools.php' );

		add_submenu_page( 'tools.php', esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'publish_posts', 'https://wordpress.com/marketing/tools/' . $this->domain );
		add_submenu_page( 'tools.php', esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain );

		// Import/Export on Jetpack sites is always handled on WP Admin.
		add_submenu_page( 'tools.php', esc_attr__( 'Import', 'jetpack' ), __( 'Import', 'jetpack' ), 'import', 'import.php' );
		add_submenu_page( 'tools.php', esc_attr__( 'Export', 'jetpack' ), __( 'Export', 'jetpack' ), 'export', 'export.php' );
	}

	/**
	 * Adds WP Admin menu.
	 */
	public function add_wp_admin_menu() {
		global $menu;

		$this->remove_submenus( 'index.php' );

		// Attempt to get last position.
		ksort( $menu );
		end( $menu );
		$position = key( $menu );

		$this->add_admin_menu_separator( ++$position );
		$this->update_menu( 'index.php', null, __( 'WP Admin', 'jetpack' ), null, 'dashicons-wordpress-alt', $position );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin_themes = false, $wp_admin_customize = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Remove all submenus except Themes and Customize to mimic the old Calypso navigation.
		$this->remove_submenus( 'themes.php' );
		add_submenu_page( 'themes.php', esc_attr__( 'Themes', 'jetpack' ), __( 'Themes', 'jetpack' ), 'switch_themes', 'https://wordpress.com/themes/' . $this->domain );
		// Customize on Jetpack sites is always done on WP Admin (unsupported by Calypso).
		add_submenu_page( 'themes.php', esc_attr__( 'Customize', 'jetpack' ), __( 'Customize', 'jetpack' ), 'customize', 'customize.php' );
	}

	/**
	 * Adds Posts menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_posts_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_posts_menu();

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'edit.php' );
	}

	/**
	 * Adds Page menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_page_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_page_menu();

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'edit.php?post_type=page' );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string $post_type Custom post type.
	 * @param bool   $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_custom_post_type_menu( $post_type, $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_custom_post_type_menu( $post_type );

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'edit.php?post_type=' . $post_type );
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_users_menu();

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'users.php' );
	}

	/**
	 * Adds Feedback menu.
	 */
	public function add_feedback_menu() {
		$post_type = 'feedback';

		$ptype_obj = get_post_type_object( $post_type );
		if ( empty( $ptype_obj ) ) {
			return;
		}

		$slug       = 'edit.php?post_type=' . $post_type;
		$name       = $ptype_obj->labels->menu_name;
		$capability = $ptype_obj->cap->edit_posts;
		$icon       = $ptype_obj->menu_icon;
		$position   = 45; // Before Jetpack.

		add_menu_page( esc_attr( $name ), $name, $capability, $slug, null, $icon, $position );
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		// Force Calypso links on Jetpack sites since Nav Unification is disabled on WP Admin.
		return false;
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_plugins_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Plugins on Jetpack sites are always managed on Calypso.
		parent::add_plugins_menu( false );
	}
}
