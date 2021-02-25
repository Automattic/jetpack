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
		$admin_slug = 'tools.php';
		$menu_slug  = 'https://wordpress.com/marketing/tools/' . $this->domain;

		remove_menu_page( $admin_slug );
		$this->remove_submenus( $admin_slug );

		add_menu_page( esc_attr__( 'Tools', 'jetpack' ), __( 'Tools', 'jetpack' ), 'publish_posts', $menu_slug, null, 'dashicons-admin-tools', 75 );
		add_submenu_page( $menu_slug, esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'publish_posts', $menu_slug );
		add_submenu_page( $menu_slug, esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain );

		// Import/Export on Jetpack sites is always handled on WP Admin.
		add_submenu_page( $menu_slug, esc_attr__( 'Import', 'jetpack' ), __( 'Import', 'jetpack' ), 'import', 'import.php' );
		add_submenu_page( $menu_slug, esc_attr__( 'Export', 'jetpack' ), __( 'Export', 'jetpack' ), 'export', 'export.php' );

	}

	/**
	 * Adds WP Admin menu.
	 */
	public function add_wp_admin_menu() {
		global $menu;
		$menu_slug = 'index.php';

		remove_menu_page( $menu_slug );
		$this->remove_submenus( $menu_slug );

		// Attempt to get last position.
		ksort( $menu );
		end( $menu );
		$position = key( $menu );

		$this->add_admin_menu_separator( ++$position );

		add_menu_page( __( 'WP Admin', 'jetpack' ), __( 'WP Admin', 'jetpack' ), 'read', $menu_slug, null, 'dashicons-wordpress-alt', $position );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin_themes = false, $wp_admin_customize = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$appearance_cap = current_user_can( 'switch_themes' ) ? 'switch_themes' : 'edit_theme_options';
		$admin_slug     = 'themes.php';
		$menu_slug      = 'https://wordpress.com/themes/' . $this->domain;

		// Remove all submenus except Themes and Customize to mimic the old Calypso navigation.
		remove_menu_page( $admin_slug );
		$this->remove_submenus( $admin_slug );
		add_menu_page( esc_attr__( 'Appearance', 'jetpack' ), __( 'Appearance', 'jetpack' ), $appearance_cap, $menu_slug, null, 'dashicons-admin-appearance', 60 );
		add_submenu_page( $menu_slug, esc_attr__( 'Themes', 'jetpack' ), __( 'Themes', 'jetpack' ), 'switch_themes', $menu_slug );

		// Customize on Jetpack sites is always done on WP Admin (unsupported by Calypso).
		add_submenu_page( $menu_slug, esc_attr__( 'Customize', 'jetpack' ), __( 'Customize', 'jetpack' ), 'customize', 'customize.php' );
	}

	/**
	 * Adds Posts menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_posts_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_posts_menu();

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'https://wordpress.com/posts/' . $this->domain );
	}

	/**
	 * Adds Page menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_page_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_page_menu();

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'https://wordpress.com/pages/' . $this->domain );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string $post_type Custom post type.
	 * @param bool   $wp_admin  Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_custom_post_type_menu( $post_type, $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_custom_post_type_menu( $post_type );

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'https://wordpress.com/types/' . $post_type . '/' . $this->domain );
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::add_users_menu();

		// Remove all submenus to mimic the old Calypso navigation.
		$this->remove_submenus( 'https://wordpress.com/people/team/' . $this->domain );
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
	 * Migrates submenu items from wp-admin menu slugs to Calypso menu slugs.
	 *
	 * @param string $old_slug WP-Admin menu slug.
	 * @param string $new_slug Calypso menu slug. (Calypso URL).
	 */
	public function migrate_submenus( $old_slug, $new_slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Do not migrate menu on Jetpack sites, since we don't want WP Admin links.
		// Instead we remove the submenu since they won't be used.
		$this->remove_submenus( $old_slug );
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
