<?php
/**
 * Jetpack Admin Menu file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Blaze;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Modules;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class Jetpack_Admin_Menu.
 */
class Jetpack_Admin_Menu extends Admin_Menu {

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

		// Reset menus so there are no third-party plugin items.
		$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		parent::reregister_menu_items();

		$this->add_feedback_menu();
		$this->add_cpt_menus();
		$this->add_wp_admin_menu();

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Get the preferred view for the given screen.
	 *
	 * @param string $screen Screen identifier.
	 * @param bool   $fallback_global_preference (Optional) Whether the global preference for all screens should be used
	 *                                           as fallback if there is no specific preference for the given screen.
	 *                                           Default: true.
	 * @return string
	 */
	public function get_preferred_view( $screen, $fallback_global_preference = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Force default views (Calypso) on Jetpack sites since Nav Unification is disabled on WP Admin.
		return self::DEFAULT_VIEW;
	}

	/**
	 * Get the Calypso or wp-admin link to CPT page.
	 *
	 * @param object $ptype_obj The post type object.
	 * @return string The link to Calypso if SSO is enabled and the post_type
	 * supports rest or to WP Admin if SSO is disabled.
	 */
	public function get_cpt_menu_link( $ptype_obj ) {

		$post_type              = $ptype_obj->name;
		$is_woocommerce_product = $post_type === 'product' && class_exists( 'WooCommerce' );

		if ( ! $is_woocommerce_product && ( new Modules() )->is_active( 'sso' ) && $ptype_obj->show_in_rest ) {
			return 'https://wordpress.com/types/' . $post_type . '/' . $this->domain;
		} else {
			return 'edit.php?post_type=' . $post_type;
		}
	}

	/**
	 * Adds Posts menu.
	 */
	public function add_posts_menu() {
		$post = get_post_type_object( 'post' );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr( $post->labels->menu_name ), $post->labels->menu_name, $post->cap->edit_posts, 'https://wordpress.com/posts/' . $this->domain, null, 'dashicons-admin-post' );
	}

	/**
	 * Adds Media menu.
	 */
	public function add_media_menu() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( __( 'Media', 'jetpack-masterbar' ), __( 'Media', 'jetpack-masterbar' ), 'upload_files', 'https://wordpress.com/media/' . $this->domain, null, 'dashicons-admin-media' );
	}

	/**
	 * Adds Page menu.
	 */
	public function add_page_menu() {
		$page = get_post_type_object( 'page' );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr( $page->labels->menu_name ), $page->labels->menu_name, $page->cap->edit_posts, 'https://wordpress.com/pages/' . $this->domain, null, 'dashicons-admin-page' );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string   $post_type Custom post type.
	 * @param int|null $position Optional. Position where to display the menu item. Default null.
	 */
	public function add_custom_post_type_menu( $post_type, $position = null ) {
		$ptype_obj = get_post_type_object( $post_type );
		if ( empty( $ptype_obj ) ) {
			return;
		}

		$menu_slug = $this->get_cpt_menu_link( $ptype_obj );

		// Menu icon.
		$menu_icon = 'dashicons-admin-post';
		if ( is_string( $ptype_obj->menu_icon ) ) {
			// Special handling for data:image/svg+xml and Dashicons.
			if ( str_starts_with( $ptype_obj->menu_icon, 'data:image/svg+xml;base64,' ) || str_starts_with( $ptype_obj->menu_icon, 'dashicons-' ) ) {
				$menu_icon = $ptype_obj->menu_icon;
			} else {
				$menu_icon = esc_url( $ptype_obj->menu_icon );
			}
		}

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, $menu_icon, $position );
	}

	/**
	 * Adds Comments menu.
	 */
	public function add_comments_menu() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Comments', 'jetpack-masterbar' ), __( 'Comments', 'jetpack-masterbar' ), 'edit_posts', 'https://wordpress.com/comments/all/' . $this->domain, null, 'dashicons-admin-comments' );
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
		$name       = __( 'Feedback', 'jetpack-masterbar' );
		$capability = $ptype_obj->cap->edit_posts;
		$icon       = $ptype_obj->menu_icon;
		$position   = 45; // Before Jetpack.

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr( $name ), $name, $capability, $slug, null, $icon, $position );
	}

	/**
	 * Adds CPT menu items
	 */
	public function add_cpt_menus() {

		$post_type_list = get_post_types(
			array(
				'show_in_menu' => true,
				'_builtin'     => false,
			)
		);

		foreach ( $post_type_list as $post_type ) {
			$position = 46; // After Feedback.
			$this->add_custom_post_type_menu( $post_type, $position );
		}
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		parent::add_jetpack_menu();

		/* translators: Jetpack sidebar menu item. */
		add_submenu_page( 'jetpack', esc_attr__( 'Search', 'jetpack-masterbar' ), __( 'Search', 'jetpack-masterbar' ), 'manage_options', 'jetpack-search', admin_url( 'admin.php?page=jetpack-search' ), 4 );

		// Place "Scan" submenu after Backup.
		$position = 0;
		global $submenu;
		foreach ( $submenu['jetpack'] as $submenu_item ) {
			++$position;
			if ( __( 'Backup', 'jetpack-masterbar' ) === $submenu_item[3] ) {
				break;
			}
		}
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'jetpack', esc_attr__( 'Scan', 'jetpack-masterbar' ), __( 'Scan', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/scan/' . $this->domain, null, $position );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu() {
		$themes_url = 'https://wordpress.com/themes/' . $this->domain;
		// Customize on Jetpack sites is always done on WP Admin (unsupported by Calypso).
		$customize_url = 'customize.php';
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Appearance', 'jetpack-masterbar' ), __( 'Appearance', 'jetpack-masterbar' ), 'switch_themes', $themes_url, null, 'dashicons-admin-appearance', 60 );
		add_submenu_page( $themes_url, esc_attr__( 'Themes', 'jetpack-masterbar' ), __( 'Themes', 'jetpack-masterbar' ), 'switch_themes', 'https://wordpress.com/themes/' . $this->domain );

		if ( ! has_action( 'customize_register' ) && wp_is_block_theme() ) {
			return $customize_url;
		}

		add_submenu_page( $themes_url, esc_attr__( 'Customize', 'jetpack-masterbar' ), __( 'Customize', 'jetpack-masterbar' ), 'customize', $customize_url );

		return $customize_url;
	}

	/**
	 * Adds Plugins menu.
	 */
	public function add_plugins_menu() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Plugins', 'jetpack-masterbar' ), __( 'Plugins', 'jetpack-masterbar' ), 'activate_plugins', 'https://wordpress.com/plugins/' . $this->domain, null, 'dashicons-admin-plugins', 65 );
	}

	/**
	 * Adds Users menu.
	 */
	public function add_users_menu() {
		if ( current_user_can( 'list_users' ) ) {
			$users_url = 'https://wordpress.com/people/team/' . $this->domain;
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_menu_page( esc_attr__( 'Users', 'jetpack-masterbar' ), __( 'Users', 'jetpack-masterbar' ), 'list_users', $users_url, null, 'dashicons-admin-users', 70 );
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( $users_url, esc_attr__( 'All Users', 'jetpack-masterbar' ), __( 'All Users', 'jetpack-masterbar' ), 'list_users', $users_url, null, 10 );
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( $users_url, esc_attr__( 'Add New User', 'jetpack-masterbar' ), __( 'Add New User', 'jetpack-masterbar' ), 'promote_users', 'https://wordpress.com/people/new/' . $this->domain, null, 20 );
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( $users_url, esc_attr__( 'Subscribers', 'jetpack-masterbar' ), __( 'Subscribers', 'jetpack-masterbar' ), 'list_users', 'https://wordpress.com/subscribers/' . $this->domain, null, 30 );
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( $users_url, esc_attr__( 'My Profile', 'jetpack-masterbar' ), __( 'My Profile', 'jetpack-masterbar' ), 'read', 'https://wordpress.com/me', null, 40 );
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( $users_url, esc_attr__( 'Account Settings', 'jetpack-masterbar' ), __( 'Account Settings', 'jetpack-masterbar' ), 'read', 'https://wordpress.com/me/account', null, 50 );
		} else {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_menu_page( esc_attr__( 'My Profile', 'jetpack-masterbar' ), __( 'Profile', 'jetpack-masterbar' ), 'read', 'https://wordpress.com/me', null, 'dashicons-admin-users', 70 );
		}
	}

	/**
	 * Adds Tools menu.
	 */
	public function add_tools_menu() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Tools', 'jetpack-masterbar' ), __( 'Tools', 'jetpack-masterbar' ), 'publish_posts', 'tools.php', null, 'dashicons-admin-tools', 75 );
		add_submenu_page( 'tools.php', esc_attr__( 'Marketing', 'jetpack-masterbar' ), __( 'Marketing', 'jetpack-masterbar' ), 'publish_posts', 'https://wordpress.com/marketing/tools/' . $this->domain );

		if ( Blaze::should_initialize()['can_init'] ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'tools.php', esc_attr__( 'Advertising', 'jetpack-masterbar' ), __( 'Advertising', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/advertising/' . $this->domain, null, 1 );
		}

		add_submenu_page( 'tools.php', esc_attr__( 'Monetize', 'jetpack-masterbar' ), __( 'Monetize', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain );

		// Import/Export on Jetpack sites is always handled on WP Admin.
		add_submenu_page( 'tools.php', esc_attr__( 'Import', 'jetpack-masterbar' ), __( 'Import', 'jetpack-masterbar' ), 'import', 'import.php' );
		add_submenu_page( 'tools.php', esc_attr__( 'Export', 'jetpack-masterbar' ), __( 'Export', 'jetpack-masterbar' ), 'export', 'export.php' );

		// Remove the submenu auto-created by Core.
		$this->hide_submenu_page( 'tools.php', 'tools.php' );
	}

	/**
	 * Adds Settings menu.
	 */
	public function add_options_menu() {
		$slug = 'https://wordpress.com/settings/general/' . $this->domain;
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Settings', 'jetpack-masterbar' ), __( 'Settings', 'jetpack-masterbar' ), 'manage_options', $slug, null, 'dashicons-admin-settings', 80 );
		add_submenu_page( $slug, esc_attr__( 'General', 'jetpack-masterbar' ), __( 'General', 'jetpack-masterbar' ), 'manage_options', $slug );
		add_submenu_page( $slug, esc_attr__( 'Security', 'jetpack-masterbar' ), __( 'Security', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/security/' . $this->domain );
		add_submenu_page( $slug, esc_attr__( 'Performance', 'jetpack-masterbar' ), __( 'Performance', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/performance/' . $this->domain );
		add_submenu_page( $slug, esc_attr__( 'Writing', 'jetpack-masterbar' ), __( 'Writing', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/writing/' . $this->domain );
		add_submenu_page( $slug, esc_attr__( 'Reading', 'jetpack-masterbar' ), __( 'Reading', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/reading/' . $this->domain );
		add_submenu_page( $slug, esc_attr__( 'Discussion', 'jetpack-masterbar' ), __( 'Discussion', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/discussion/' . $this->domain );
		add_submenu_page( $slug, esc_attr__( 'Newsletter', 'jetpack-masterbar' ), __( 'Newsletter', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/newsletter/' . $this->domain );

		$plan_supports_scan = Jetpack_Plan::supports( 'scan' );
		$products           = Jetpack_Plan::get_products();
		$has_scan_product   = false;

		if ( is_array( $products ) ) {
			foreach ( $products as $product ) {
				if ( strpos( $product['product_slug'], 'jetpack_scan' ) === 0 ) {
					$has_scan_product = true;
					break;
				}
			}
		}

		$has_scan     = $plan_supports_scan || $has_scan_product;
		$rewind_state = get_transient( 'jetpack_rewind_state' );
		$has_backup   = $rewind_state && in_array( $rewind_state->state, array( 'awaiting_credentials', 'provisioning', 'active' ), true );
		if ( $has_scan || $has_backup ) {
			add_submenu_page( $slug, esc_attr__( 'Jetpack', 'jetpack-masterbar' ), __( 'Jetpack', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/settings/jetpack/' . $this->domain );
		}
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

		$this->add_admin_menu_separator( ++$position );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( __( 'WP Admin', 'jetpack-masterbar' ), __( 'WP Admin', 'jetpack-masterbar' ), 'read', 'index.php', null, 'dashicons-wordpress-alt', $position );
	}
}
