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
	 * Jetpack_Admin_Menu constructor.
	 */
	public function __construct() {
		parent::__construct();

		add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
		add_action( 'admin_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
	}

	/**
	 * Dequeues unnecessary scripts.
	 */
	public function dequeue_scripts() {
		wp_dequeue_script( 'a8c_wpcom_masterbar_overrides' ); // Initially loaded in modules/masterbar/masterbar/class-masterbar.php.
	}

	/**
	 * Determines whether the current locale is right-to-left (RTL).
	 *
	 * Performs the check against the current locale set on the WordPress.com's account settings.
	 * See `Masterbar::__construct` in `modules/masterbar/masterbar/class-masterbar.php`.
	 */
	public function is_rtl() {
		return get_user_option( 'jetpack_wpcom_is_rtl' );
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		global $menu, $submenu;

		// Change the menu only when rendered in Calypso.
		if ( $this->is_api_request || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			// Reset menus so there are no third-party plugin items.
			$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

			parent::reregister_menu_items();

			$this->add_feedback_menu();
			$this->add_wp_admin_menu();

			ksort( $GLOBALS['menu'] );
		}
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
	 * Adds Posts menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_posts_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$post = get_post_type_object( 'post' );
		add_menu_page( esc_attr( $post->labels->menu_name ), $post->labels->menu_name, $post->cap->edit_posts, 'https://wordpress.com/posts/' . $this->domain, null, 'dashicons-admin-post' );
	}

	/**
	 * Adds Media menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_media_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_menu_page( __( 'Media', 'jetpack' ), __( 'Media', 'jetpack' ), 'upload_files', 'https://wordpress.com/media/' . $this->domain, null, 'dashicons-admin-media' );
	}

	/**
	 * Adds Page menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_page_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$page = get_post_type_object( 'page' );
		add_menu_page( esc_attr( $page->labels->menu_name ), $page->labels->menu_name, $page->cap->edit_posts, 'https://wordpress.com/pages/' . $this->domain, null, 'dashicons-admin-page' );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string $post_type Custom post type.
	 * @param bool   $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_custom_post_type_menu( $post_type, $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ptype_obj = get_post_type_object( $post_type );
		if ( empty( $ptype_obj ) ) {
			return;
		}

		$menu_slug = 'https://wordpress.com/types/' . $post_type . '/' . $this->domain;

		// Menu icon.
		$menu_icon = 'dashicons-admin-post';
		if ( is_string( $ptype_obj->menu_icon ) ) {
			// Special handling for data:image/svg+xml and Dashicons.
			if ( 0 === strpos( $ptype_obj->menu_icon, 'data:image/svg+xml;base64,' ) || 0 === strpos( $ptype_obj->menu_icon, 'dashicons-' ) ) {
				$menu_icon = $ptype_obj->menu_icon;
			} else {
				$menu_icon = esc_url( $ptype_obj->menu_icon );
			}
		}

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, $menu_icon );
	}

	/**
	 * Adds Comments menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_comments_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_menu_page( esc_attr__( 'Comments', 'jetpack' ), __( 'Comments', 'jetpack' ), 'edit_posts', 'https://wordpress.com/comments/all/' . $this->domain, null, 'dashicons-admin-comments' );
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
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		parent::add_jetpack_menu();

		// Place "Scan" submenu after Backup.
		$position = 0;
		global $submenu;
		foreach ( $submenu['jetpack'] as $submenu_item ) {
			$position ++;
			if ( __( 'Backup', 'jetpack' ) === $submenu_item[3] ) {
				break;
			}
		}
		add_submenu_page( 'jetpack', esc_attr__( 'Scan', 'jetpack' ), __( 'Scan', 'jetpack' ), 'manage_options', 'https://wordpress.com/scan/' . $this->domain, null, $position );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin_themes = false, $wp_admin_customize = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_menu_page( esc_attr__( 'Appearance', 'jetpack' ), __( 'Appearance', 'jetpack' ), 'switch_themes', 'https://wordpress.com/themes/' . $this->domain, null, 'dashicons-admin-appearance', 60 );
		add_submenu_page( 'themes.php', esc_attr__( 'Themes', 'jetpack' ), __( 'Themes', 'jetpack' ), 'switch_themes', 'https://wordpress.com/themes/' . $this->domain );
		// Customize on Jetpack sites is always done on WP Admin (unsupported by Calypso).
		add_submenu_page( 'themes.php', esc_attr__( 'Customize', 'jetpack' ), __( 'Customize', 'jetpack' ), 'customize', 'customize.php' );
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_plugins_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_menu_page( esc_attr__( 'Plugins', 'jetpack' ), __( 'Plugins', 'jetpack' ), 'activate_plugins', 'https://wordpress.com/plugins/' . $this->domain, null, 'dashicons-admin-plugins', 65 );
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'list_users' ) ) {
			add_menu_page( esc_attr__( 'Users', 'jetpack' ), __( 'Users', 'jetpack' ), 'list_users', 'https://wordpress.com/people/team/' . $this->domain, null, 'dashicons-admin-users', 70 );
		} else {
			add_menu_page( esc_attr__( 'My Profile', 'jetpack' ), __( 'Profile', 'jetpack' ), 'read', 'https://wordpress.com/me', null, 'dashicons-admin-users', 70 );
		}
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin_import Optional. Whether Import link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_export Optional. Whether Export link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin_import = false, $wp_admin_export = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_menu_page( esc_attr__( 'Tools', 'jetpack' ), __( 'Tools', 'jetpack' ), 'publish_posts', 'tools.php', null, 'dashicons-admin-tools', 75 );

		add_submenu_page( 'tools.php', esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'publish_posts', 'https://wordpress.com/marketing/tools/' . $this->domain );
		add_submenu_page( 'tools.php', esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain );

		// Import/Export on Jetpack sites is always handled on WP Admin.
		add_submenu_page( 'tools.php', esc_attr__( 'Import', 'jetpack' ), __( 'Import', 'jetpack' ), 'import', 'import.php' );
		add_submenu_page( 'tools.php', esc_attr__( 'Export', 'jetpack' ), __( 'Export', 'jetpack' ), 'export', 'export.php' );

		// Remove the submenu auto-created by Core.
		remove_submenu_page( 'tools.php', 'tools.php' );
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_options_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		add_menu_page( esc_attr__( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/general/' . $this->domain, null, 'dashicons-admin-settings', 80 );
	}

	/**
	 * Adds WP Admin menu.
	 */
	public function add_wp_admin_menu() {
		global $menu;

		// Attempt to get last position.
		ksort( $menu );
		end( $menu );
		$position = key( $menu );

		$this->add_admin_menu_separator( ++ $position );
		add_menu_page( __( 'WP Admin', 'jetpack' ), __( 'WP Admin', 'jetpack' ), 'read', 'index.php', null, 'dashicons-wordpress-alt', $position );
	}
}
