<?php
/**
 * Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Redirect;

require_once __DIR__ . '/class-base-admin-menu.php';

/**
 * Class Admin_Menu.
 */
class Admin_Menu extends Base_Admin_Menu {

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		// Constant is not defined until parse_request.
		if ( ! $this->is_api_request ) {
			$this->is_api_request = defined( 'REST_REQUEST' ) && REST_REQUEST;
		}

		/*
		 * Whether links should point to Calypso or wp-admin.
		 *
		 * Options:
		 * false - Calypso (Default).
		 * true  - wp-admin.
		 */
		$wp_admin = $this->should_link_to_wp_admin();

		// Remove separators.
		remove_menu_page( 'separator1' );

		$this->add_stats_menu();
		$this->add_upgrades_menu();
		$this->add_posts_menu( $wp_admin );
		$this->add_media_menu( $wp_admin );
		$this->add_page_menu( $wp_admin );
		$this->add_testimonials_menu( $wp_admin );
		$this->add_portfolio_menu( $wp_admin );
		$this->add_comments_menu( $wp_admin );

		// Whether Themes/Customize links should point to Calypso (false) or wp-admin (true).
		$wp_admin_themes    = $wp_admin;
		$wp_admin_customize = $wp_admin;
		$this->add_appearance_menu( $wp_admin_themes, $wp_admin_customize );
		$this->add_plugins_menu( $wp_admin );
		$this->add_users_menu( $wp_admin );

		// Whether Import/Export links should point to Calypso (false) or wp-admin (true).
		$wp_admin_import = $wp_admin;
		$wp_admin_export = $wp_admin;
		$this->add_tools_menu( $wp_admin_import, $wp_admin_export );

		$this->add_options_menu( $wp_admin );
		$this->add_jetpack_menu();
		$this->add_gutenberg_menus( $wp_admin );

		// Remove Links Manager menu since its usage is discouraged. https://github.com/Automattic/wp-calypso/issues/51188.
		// @see https://core.trac.wordpress.org/ticket/21307#comment:73.
		if ( $this->should_disable_links_manager() ) {
			remove_menu_page( 'link-manager.php' );
		}

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Check if Links Manager is being used.
	 */
	public function should_disable_links_manager() {
		// The max ID number of the auto-generated links.
		// See /wp-content/mu-plugins/wpcom-wp-install-defaults.php in WP.com.
		$max_default_id = 10;

		// We are only checking the latest entry link_id so are limiting the query to 1.
		$link_manager_links = get_bookmarks(
			array(
				'orderby'        => 'link_id',
				'order'          => 'DESC',
				'limit'          => 1,
				'hide_invisible' => 0,
			)
		);

		// Ordered links by ID descending, check if the first ID is more than $max_default_id.
		if ( count( $link_manager_links ) > 0 && $link_manager_links[0]->link_id > $max_default_id ) {
			return false;
		}

		return true;
	}

	/**
	 * Adds My Home menu.
	 */
	public function add_my_home_menu() {
		$this->update_menu( 'index.php', 'https://wordpress.com/home/' . $this->domain, __( 'My Home', 'jetpack' ), 'manage_options', 'dashicons-admin-home' );
	}

	/**
	 * Adds Stats menu.
	 */
	public function add_stats_menu() {
		add_menu_page( __( 'Stats', 'jetpack' ), __( 'Stats', 'jetpack' ), 'view_stats', 'https://wordpress.com/stats/day/' . $this->domain, null, 'dashicons-chart-bar', 3 );
	}

	/**
	 * Adds Upgrades menu.
	 */
	public function add_upgrades_menu() {
		global $menu;

		$menu_exists = false;
		foreach ( $menu as $item ) {
			if ( 'paid-upgrades.php' === $item[2] ) {
				$menu_exists = true;
				break;
			}
		}

		if ( ! $menu_exists ) {
			add_menu_page( __( 'Upgrades', 'jetpack' ), __( 'Upgrades', 'jetpack' ), 'manage_options', 'paid-upgrades.php', null, 'dashicons-cart', 4 );
		}

		add_submenu_page( 'paid-upgrades.php', __( 'Plans', 'jetpack' ), __( 'Plans', 'jetpack' ), 'manage_options', 'https://wordpress.com/plans/' . $this->domain, null, 5 );
		add_submenu_page( 'paid-upgrades.php', __( 'Purchases', 'jetpack' ), __( 'Purchases', 'jetpack' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 15 );

		if ( ! $menu_exists ) {
			// Remove the submenu auto-created by Core.
			remove_submenu_page( 'paid-upgrades.php', 'paid-upgrades.php' );
		}
	}

	/**
	 * Adds Posts menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_posts_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$submenus_to_update = array(
			'edit.php'     => 'https://wordpress.com/posts/' . $this->domain,
			'post-new.php' => 'https://wordpress.com/post/' . $this->domain,
		);
		$this->update_submenus( 'edit.php', $submenus_to_update );
	}

	/**
	 * Adds Media menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_media_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		remove_submenu_page( 'upload.php', 'media-new.php' );

		$this->update_menu( 'upload.php', 'https://wordpress.com/media/' . $this->domain );
	}

	/**
	 * Adds Page menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_page_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$submenus_to_update = array(
			'edit.php?post_type=page'     => 'https://wordpress.com/pages/' . $this->domain,
			'post-new.php?post_type=page' => 'https://wordpress.com/page/' . $this->domain,
		);
		$this->update_submenus( 'edit.php?post_type=page', $submenus_to_update );
	}

	/**
	 * Adds Testimonials menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_testimonials_menu( $wp_admin = false ) {
		$this->add_custom_post_type_menu( 'jetpack-testimonial', $wp_admin );
	}

	/**
	 * Adds Portfolio menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_portfolio_menu( $wp_admin = false ) {
		$this->add_custom_post_type_menu( 'jetpack-portfolio', $wp_admin );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string $post_type Custom post type.
	 * @param bool   $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_custom_post_type_menu( $post_type, $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$submenus_to_update = array(
			'edit.php?post_type=' . $post_type     => 'https://wordpress.com/types/' . $post_type . '/' . $this->domain,
			'post-new.php?post_type=' . $post_type => 'https://wordpress.com/edit/' . $post_type . '/' . $this->domain,
		);
		$this->update_submenus( 'edit.php?post_type=' . $post_type, $submenus_to_update );
	}

	/**
	 * Adds Comments menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_comments_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$this->update_menu( 'edit-comments.php', 'https://wordpress.com/comments/all/' . $this->domain );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu( $wp_admin_themes = false, $wp_admin_customize = false ) {
		$request_uri                     = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		$default_customize_slug          = add_query_arg( 'return', rawurlencode( remove_query_arg( wp_removable_query_args(), $request_uri ) ), 'customize.php' );
		$default_customize_header_slug_1 = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $default_customize_slug );
		// TODO: Remove WPCom_Theme_Customizer::modify_header_menu_links() and WPcom_Custom_Header::modify_admin_menu_links().
		$default_customize_header_slug_2     = admin_url( 'themes.php?page=custom-header' );
		$default_customize_background_slug_1 = add_query_arg( array( 'autofocus' => array( 'control' => 'background_image' ) ), $default_customize_slug );
		// TODO: Remove Colors_Manager::modify_header_menu_links() and Colors_Manager_Common::modify_header_menu_links().
		$default_customize_background_slug_2 = add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), admin_url( 'customize.php' ) );

		if ( ! $wp_admin_customize ) {
			$customize_url = 'https://wordpress.com/customize/' . $this->domain;
		} elseif ( $this->is_api_request ) {
			// In case this is an api request we will have to add the 'return' querystring via JS.
			$customize_url = 'customize.php';
		} else {
			$customize_url = $default_customize_slug;
		}

		$submenus_to_update = array(
			$default_customize_slug              => $customize_url,
			$default_customize_header_slug_1     => add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url ),
			$default_customize_header_slug_2     => add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url ),
			$default_customize_background_slug_1 => add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $customize_url ),
			$default_customize_background_slug_2 => add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $customize_url ),
		);

		if ( ! $wp_admin_themes ) {
			$submenus_to_update['themes.php'] = 'https://wordpress.com/themes/' . $this->domain;
		}

		if ( ! $wp_admin_customize ) {
			$submenus_to_update['widgets.php']       = add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $customize_url );
			$submenus_to_update['gutenberg-widgets'] = add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $customize_url );
			$submenus_to_update['nav-menus.php']     = add_query_arg( array( 'autofocus' => array( 'panel' => 'nav_menus' ) ), $customize_url );
		}

		$this->update_submenus( 'themes.php', $submenus_to_update );

		remove_submenu_page( 'themes.php', 'custom-header' );
		remove_submenu_page( 'themes.php', 'custom-background' );

		return $customize_url;
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_plugins_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		remove_submenu_page( 'plugins.php', 'plugin-install.php' );
		remove_submenu_page( 'plugins.php', 'plugin-editor.php' );

		$this->update_menu( 'plugins.php', 'https://wordpress.com/plugins/' . $this->domain );
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) {
		if ( current_user_can( 'list_users' ) ) {
			// We shall add the Calypso user management & add new user screens at all cases ( Calypso & Atomic ).
			$submenus_to_update = array(
				'user-new.php' => 'https://wordpress.com/people/new/' . $this->domain,
				'users.php'    => 'https://wordpress.com/people/team/' . $this->domain,
			);
			if ( ! $wp_admin ) {
				$submenus_to_update['profile.php'] = 'https://wordpress.com/me';
			}
			$this->update_submenus( 'users.php', $submenus_to_update );
			add_submenu_page( 'users.php', esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', 'https://wordpress.com/me/account' );
		} else {
			if ( ! $wp_admin ) {
				$submenus_to_update = array(
					'user-new.php' => 'https://wordpress.com/people/new/' . $this->domain,
					'profile.php'  => 'https://wordpress.com/me',
				);
				$this->update_submenus( 'profile.php', $submenus_to_update );
			}

			add_submenu_page( 'profile.php', esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', 'https://wordpress.com/me/account' );
		}
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin_import Optional. Whether Import link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_export Optional. Whether Export link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin_import = false, $wp_admin_export = false ) {
		$submenus_to_update = array();
		if ( ! $wp_admin_import ) {
			$submenus_to_update['import.php'] = 'https://wordpress.com/import/' . $this->domain;
		}
		if ( ! $wp_admin_export ) {
			$submenus_to_update['export.php'] = 'https://wordpress.com/export/' . $this->domain;
		}
		$this->update_submenus( 'tools.php', $submenus_to_update );

		remove_submenu_page( 'tools.php', 'tools.php' );
		remove_submenu_page( 'tools.php', 'delete-blog' );

		add_submenu_page( 'tools.php', esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'publish_posts', 'https://wordpress.com/marketing/tools/' . $this->domain, null, 0 );
		add_submenu_page( 'tools.php', esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain, null, 1 );
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_options_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$this->update_submenus( 'options-general.php', array( 'options-general.php' => 'https://wordpress.com/settings/general/' . $this->domain ) );

		remove_submenu_page( 'options-general.php', 'options-discussion.php' );
		remove_submenu_page( 'options-general.php', 'options-writing.php' );
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		$this->add_admin_menu_separator( 50, 'manage_options' );

		// TODO: Replace with proper SVG data url.
		$icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 32 32' %3E%3Cpath fill='%23a0a5aa' d='M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z'%3E%3C/path%3E%3Cpolygon fill='%23fff' points='15,19 7,19 15,3 '%3E%3C/polygon%3E%3Cpolygon fill='%23fff' points='17,29 17,13 25,13 '%3E%3C/polygon%3E%3C/svg%3E";

		$is_menu_updated = $this->update_menu( 'jetpack', null, null, null, $icon, 51 );
		if ( ! $is_menu_updated ) {
			add_menu_page( esc_attr__( 'Jetpack', 'jetpack' ), __( 'Jetpack', 'jetpack' ), 'manage_options', 'jetpack', null, $icon, 51 );
		}

		add_submenu_page( 'jetpack', esc_attr__( 'Activity Log', 'jetpack' ), __( 'Activity Log', 'jetpack' ), 'manage_options', 'https://wordpress.com/activity-log/' . $this->domain, null, 2 );
		add_submenu_page( 'jetpack', esc_attr__( 'Backup', 'jetpack' ), __( 'Backup', 'jetpack' ), 'manage_options', 'https://wordpress.com/backup/' . $this->domain, null, 3 );
		/* translators: Jetpack sidebar menu item. */
		add_submenu_page( 'jetpack', esc_attr__( 'Search', 'jetpack' ), __( 'Search', 'jetpack' ), 'read', 'https://wordpress.com/jetpack-search/' . $this->domain, null, 4 );

		remove_submenu_page( 'jetpack', 'stats' );
		remove_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-backups' ) ) );
		remove_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-scanner' ) ) );

		if ( ! $is_menu_updated ) {
			// Remove the submenu auto-created by Core.
			remove_submenu_page( 'jetpack', 'jetpack' );
		}
	}

	/**
	 * Re-adds the Site Editor menu without the (beta) tag, and where we want it.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_gutenberg_menus( $wp_admin = false ) {
		// We can bail if we don't meet the conditions of the Site Editor.
		if ( ! ( function_exists( 'gutenberg_is_fse_theme' ) && gutenberg_is_fse_theme() ) ) {
			return;
		}

		// Core Gutenberg registers without an explicit position, and we don't want the (beta) tag.
		remove_menu_page( 'gutenberg-edit-site' );
		// Core Gutenberg tries to manage its position, foiling our best laid plans. Unfoil.
		remove_filter( 'menu_order', 'gutenberg_menu_order' );

		$link = $wp_admin ? 'gutenberg-edit-site' : 'https://wordpress.com/site-editor/' . $this->domain;

		add_menu_page(
			__( 'Site Editor', 'jetpack' ),
			__( 'Site Editor', 'jetpack' ),
			'edit_theme_options',
			$link,
			$wp_admin ? 'gutenberg_edit_site_page' : null,
			'dashicons-layout',
			61 // Just under Appearance.
		);
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		return get_user_option( 'jetpack_admin_menu_link_destination' );
	}
}
