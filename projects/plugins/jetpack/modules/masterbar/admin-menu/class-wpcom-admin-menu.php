<?php
/**
 * WP.com Admin Menu file.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Status;

/**
 * Class WPcom_Admin_Menu.
 */
class WPcom_Admin_Menu extends Admin_Menu {

	/**
	 * WPcom_Admin_Menu constructor.
	 */
	protected function __construct() {
		parent::__construct();

		$this->customize_slug = 'https://wordpress.com/customize/' . $this->domain;
	}

	/**
	 * Sets up class properties for REST API requests.
	 */
	public function rest_api_init() {
		parent::rest_api_init();

		// Get domain for requested site.
		$this->domain         = ( new Status() )->get_site_suffix();
		$this->customize_slug = 'https://wordpress.com/customize/' . $this->domain;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();

		// Not needed outside of wp-admin.
		if ( ! $this->is_api_request ) {
			$this->add_browse_sites_link();
			$this->add_site_card_menu();
			$this->add_new_site_link();
		}

		$this->add_jetpack_menu();

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Adds the site switcher link if user has more than one site.
	 */
	public function add_browse_sites_link() {
		if ( count( get_blogs_of_user( get_current_user_id() ) ) < 2 ) {
			return;
		}

		// Add the menu item.
		add_menu_page( __( 'site-switcher', 'jetpack' ), __( 'Browse sites', 'jetpack' ), 'read', 'https://wordpress.com/home', null, 'dashicons-arrow-left-alt2', 0 );
		add_filter( 'add_menu_classes', array( $this, 'set_browse_sites_link_class' ) );
	}

	/**
	 * Adds a custom element class for Site Switcher menu item.
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_browse_sites_link_class( array $menu ) {
		foreach ( $menu as $key => $menu_item ) {
			if ( 'site-switcher' !== $menu_item[3] ) {
				continue;
			}

			$menu[ $key ][4] = add_cssclass( 'site-switcher', $menu_item[4] );
			break;
		}

		return $menu;
	}

	/**
	 * Adds a link to the menu to create a new site.
	 */
	public function add_new_site_link() {
		global $menu;

		if ( count( get_blogs_of_user( get_current_user_id() ) ) > 1 ) {
			return;
		}

		// Attempt to get last position.
		$position = 1000;
		while ( isset( $menu[ $position ] ) ) {
			$position++;
		}

		$this->add_admin_menu_separator( ++$position );
		add_menu_page( __( 'Add new site', 'jetpack' ), __( 'Add new site', 'jetpack' ), 'read', 'https://wordpress.com/start?ref=calypso-sidebar', null, 'dashicons-plus-alt', ++$position );
	}

	/**
	 * Adds site card component.
	 */
	public function add_site_card_menu() {
		$default = 'data:image/svg+xml,' . rawurlencode( '<svg class="gridicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Globe</title><rect fill-opacity="0" x="0" width="24" height="24"/><g><path fill="#fff" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18l2-2 1-1v-2h-2v-1l-1-1H9v3l2 2v1.93c-3.94-.494-7-3.858-7-7.93l1 1h2v-2h2l3-3V6h-2L9 5v-.41C9.927 4.21 10.94 4 12 4s2.073.212 3 .59V6l-1 1v2l1 1 3.13-3.13c.752.897 1.304 1.964 1.606 3.13H18l-2 2v2l1 1h2l.286.286C18.03 18.06 15.24 20 12 20z"/></g></svg>' );
		$icon    = get_site_icon_url( 32, $default );

		if ( $default === $icon && blavatar_exists( $this->domain ) ) {
			$icon = blavatar_url( $this->domain, 'img', 32 );
		}

		$badge = '';
		if ( is_private_blog() ) {
			$badge .= sprintf(
				'<span class="site__badge site__badge-private">%s</span>',
				wpcom_is_coming_soon() ? esc_html__( 'Coming Soon', 'jetpack' ) : esc_html__( 'Private', 'jetpack' )
			);
		}

		if ( is_redirected_domain( $this->domain ) ) {
			$badge .= '<span class="site__badge site__badge-redirect">' . esc_html__( 'Redirect', 'jetpack' ) . '</span>';
		}

		if ( ! empty( get_option( 'options' )['is_domain_only'] ) ) {
			$badge .= '<span class="site__badge site__badge-domain-only">' . esc_html__( 'Domain', 'jetpack' ) . '</span>';
		}

		$site_card = '
<div class="site__info">
	<div class="site__title">%1$s</div>
	<div class="site__domain">%2$s</div>
	%3$s
</div>';

		$site_card = sprintf(
			$site_card,
			get_option( 'blogname' ),
			$this->domain,
			$badge
		);

		add_menu_page( 'site-card', $site_card, 'read', get_home_url(), null, $icon, 1 );
		add_filter( 'add_menu_classes', array( $this, 'set_site_card_menu_class' ) );
	}

	/**
	 * Adds a custom element class and id for Site Card's menu item.
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_site_card_menu_class( array $menu ) {
		foreach ( $menu as $key => $menu_item ) {
			if ( 'site-card' !== $menu_item[3] ) {
				continue;
			}

			$classes = ' toplevel_page_site-card';
			if ( blavatar_exists( $this->domain ) ) {
				$classes .= ' has-site-icon';
			}

			$menu[ $key ][4] = $menu_item[4] . $classes;
			$menu[ $key ][5] = 'toplevel_page_site_card';
			break;
		}

		return $menu;
	}

	/**
	 * Adds Stats menu.
	 */
	public function add_stats_menu() {
		$menu_title = __( 'Stats', 'jetpack' );

		if ( ! $this->is_api_request ) {
			$menu_title .= sprintf(
				'<img class="sidebar-unified__sparkline" width="80" height="20" src="%1$s" alt="%2$s">',
				esc_url( site_url( 'wp-includes/charts/admin-bar-hours-scale-2x.php?masterbar=1&s=' . get_current_blog_id() ) ),
				esc_attr__( 'Hourly views', 'jetpack' )
			);
		}

		add_menu_page( __( 'Stats', 'jetpack' ), $menu_title, 'edit_posts', 'https://wordpress.com/stats/day/' . $this->domain, null, 'dashicons-chart-bar', 3 );
	}

	/**
	 * Adds Upgrades menu.
	 */
	public function add_upgrades_menu() {
		parent::add_upgrades_menu();

		add_submenu_page( 'https://wordpress.com/plans/' . $this->domain, __( 'Domains', 'jetpack' ), __( 'Domains', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, 10 );
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		global $menu;

		$position = 50;
		while ( isset( $menu[ $position ] ) ) {
			$position++;
		}

		// TODO: Replace with proper SVG data url.
		$jetpack_icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 32 32' %3E%3Cpath fill='%23a0a5aa' d='M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z'%3E%3C/path%3E%3Cpolygon fill='%23fff' points='15,19 7,19 15,3 '%3E%3C/polygon%3E%3Cpolygon fill='%23fff' points='17,29 17,13 25,13 '%3E%3C/polygon%3E%3C/svg%3E";
		$jetpack_slug = 'https://wordpress.com/activity-log/' . $this->domain;

		$this->add_admin_menu_separator( $position++, 'manage_options' );
		add_menu_page( esc_attr__( 'Jetpack', 'jetpack' ), __( 'Jetpack', 'jetpack' ), 'manage_options', $jetpack_slug, null, $jetpack_icon, $position );

		// Maintain id for jQuery selector.
		$menu[ $position ][5] = 'toplevel_page_jetpack'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		remove_menu_page( 'jetpack' );
		$this->migrate_submenus( 'jetpack', $jetpack_slug );

		add_submenu_page( $jetpack_slug, esc_attr__( 'Activity Log', 'jetpack' ), __( 'Activity Log', 'jetpack' ), 'manage_options', $jetpack_slug, null, 5 );
		add_submenu_page( $jetpack_slug, esc_attr__( 'Backup', 'jetpack' ), __( 'Backup', 'jetpack' ), 'manage_options', 'https://wordpress.com/backup/' . $this->domain, null, 10 );

		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $jetpack_slug ) {
				return 'jetpack' === $parent_file ? $jetpack_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Plugins menu.
	 */
	public function add_plugins_menu() {
		parent::add_plugins_menu();

		$menu_slug = 'https://wordpress.com/plugins/' . $this->domain;

		remove_menu_page( 'plugins.php' );
		remove_submenu_page( 'plugins.php', 'plugins.php' );

		$count = '';
		if ( ! is_multisite() && current_user_can( 'update_plugins' ) ) {
			$update_data = wp_get_update_data();
			$count       = sprintf(
				'<span class="update-plugins count-%s"><span class="plugin-count">%s</span></span>',
				$update_data['counts']['plugins'],
				number_format_i18n( $update_data['counts']['plugins'] )
			);
		}

		/* translators: %s: Number of pending plugin updates. */
		add_menu_page( esc_attr__( 'Plugins', 'jetpack' ), sprintf( __( 'Plugins %s', 'jetpack' ), $count ), 'activate_plugins', $menu_slug, null, 'dashicons-admin-plugins', 65 );

		$this->migrate_submenus( 'plugins.php', $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'jetpack' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) {
		$users_slug   = $wp_admin ? 'users.php' : 'https://wordpress.com/people/team/' . $this->domain;
		$add_new_slug = 'https://wordpress.com/people/new/' . $this->domain;
		$profile_slug = $wp_admin ? 'grofiles-editor' : 'https://wordpress.com/me';
		$account_slug = $wp_admin ? 'grofiles-user-settings' : 'https://wordpress.com/me/account';

		if ( current_user_can( 'list_users' ) ) {
			remove_menu_page( 'users.php' );
			remove_submenu_page( 'users.php', 'users.php' );
			remove_submenu_page( 'users.php', 'user-new.php' );
			remove_submenu_page( 'users.php', 'profile.php' );
			remove_submenu_page( 'users.php', 'grofiles-editor' );
			remove_submenu_page( 'users.php', 'grofiles-user-settings' );

			add_menu_page( esc_attr__( 'Users', 'jetpack' ), __( 'Users', 'jetpack' ), 'list_users', $users_slug, null, 'dashicons-admin-users', 70 );
			add_submenu_page( $users_slug, esc_attr__( 'All People', 'jetpack' ), __( 'All People', 'jetpack' ), 'list_users', $users_slug, null, 5 );
			add_submenu_page( $users_slug, esc_attr__( 'Add New', 'jetpack' ), __( 'Add New', 'jetpack' ), 'promote_users', $add_new_slug, null, 10 );
			add_submenu_page( $users_slug, esc_attr__( 'My Profile', 'jetpack' ), __( 'My Profile', 'jetpack' ), 'read', $profile_slug, null, 15 );
			add_submenu_page( $users_slug, esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', $account_slug, null, 20 );

			$this->migrate_submenus( 'users.php', $users_slug );
			add_filter(
				'parent_file',
				function ( $parent_file ) use ( $users_slug ) {
					return 'users.php' === $parent_file ? $users_slug : $parent_file;
				}
			);
		} elseif ( ! $wp_admin ) {
			remove_menu_page( 'profile.php' );
			remove_submenu_page( 'profile.php', 'grofiles-editor' );
			remove_submenu_page( 'profile.php', 'grofiles-user-settings' );

			add_menu_page( esc_attr__( 'My Profile', 'jetpack' ), __( 'My Profile', 'jetpack' ), 'read', $profile_slug, null, 'dashicons-admin-users', 70 );
			add_submenu_page( $profile_slug, esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', $account_slug, null, 5 );

			$this->migrate_submenus( 'profile.php', $profile_slug );
			add_filter(
				'parent_file',
				function ( $parent_file ) use ( $profile_slug ) {
					return 'profile.php' === $parent_file ? $profile_slug : $parent_file;
				}
			);
		}
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin = false ) {
		$menu_slug = $wp_admin ? 'tools.php' : 'https://wordpress.com/marketing/tools/' . $this->domain;

		remove_submenu_page( 'tools.php', 'export.php' );

		add_submenu_page( $menu_slug, esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'manage_options', 'https://wordpress.com/marketing/tools/' . $this->domain, null, 5 );
		add_submenu_page( $menu_slug, esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain, null, 10 );
		add_submenu_page( $menu_slug, esc_attr__( 'Export', 'jetpack' ), __( 'Export', 'jetpack' ), 'export', 'https://wordpress.com/export/' . $this->domain, null, 20 );

		parent::add_tools_menu( $wp_admin );
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_options_menu( $wp_admin = false ) {
		add_options_page( esc_attr__( 'Hosting Configuration', 'jetpack' ), __( 'Hosting Configuration', 'jetpack' ), 'manage_options', 'https://wordpress.com/hosting-config/' . $this->domain, null, 6 );

		// Replace sharing menu if it exists. See Publicize_UI::sharing_menu.
		if ( remove_submenu_page( 'options-general.php', 'sharing' ) ) {
			add_options_page( esc_attr__( 'Sharing Settings', 'jetpack' ), __( 'Sharing', 'jetpack' ), 'publish_posts', 'https://wordpress.com/marketing/sharing-buttons/' . $this->domain, null, 30 );
		}

		parent::add_options_menu( $wp_admin );
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		$result = false; // Calypso.

		$user_attribute = get_user_attribute( get_current_user_id(), 'calypso_preferences' );
		if ( ! empty( $user_attribute['linkDestination'] ) ) {
			$result = $user_attribute['linkDestination'];
		}

		return $result;
	}
}
