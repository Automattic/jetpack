<?php
/**
 * WP.com Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Status;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class WPcom_Admin_Menu.
 */
class WPcom_Admin_Menu extends Admin_Menu {

	/**
	 * Sets up class properties for REST API requests.
	 *
	 * @param WP_REST_Response $response Response from the endpoint.
	 */
	public function rest_api_init( $response ) {
		parent::rest_api_init( $response );

		// Get domain for requested site.
		$this->domain = ( new Status() )->get_site_suffix();

		return $response;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();

		$this->add_my_home_menu();

		// Not needed outside of wp-admin.
		if ( ! $this->is_api_request ) {
			$this->add_browse_sites_link();
			$this->add_site_card_menu();
			$this->add_new_site_link();
		}

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
		if ( count( get_blogs_of_user( get_current_user_id() ) ) > 1 ) {
			return;
		}

		$this->add_admin_menu_separator();
		add_menu_page( __( 'Add new site', 'jetpack' ), __( 'Add new site', 'jetpack' ), 'read', 'https://wordpress.com/start?ref=calypso-sidebar', null, 'dashicons-plus-alt' );
	}

	/**
	 * Adds site card component.
	 */
	public function add_site_card_menu() {
		$default   = 'data:image/svg+xml,' . rawurlencode( '<svg class="gridicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Globe</title><rect fill-opacity="0" x="0" width="24" height="24"/><g><path fill="#fff" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18l2-2 1-1v-2h-2v-1l-1-1H9v3l2 2v1.93c-3.94-.494-7-3.858-7-7.93l1 1h2v-2h2l3-3V6h-2L9 5v-.41C9.927 4.21 10.94 4 12 4s2.073.212 3 .59V6l-1 1v2l1 1 3.13-3.13c.752.897 1.304 1.964 1.606 3.13H18l-2 2v2l1 1h2l.286.286C18.03 18.06 15.24 20 12 20z"/></g></svg>' );
		$icon      = get_site_icon_url( 32, $default );
		$blog_name = get_option( 'blogname' ) !== '' ? get_option( 'blogname' ) : $this->domain;

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
			$blog_name,
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

		add_submenu_page( 'paid-upgrades.php', __( 'Domains', 'jetpack' ), __( 'Domains', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, 10 );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin_themes = false, $wp_admin_customize = false ) {
		$customize_url = parent::add_appearance_menu( $wp_admin_themes, $wp_admin_customize );

		remove_submenu_page( 'themes.php', 'theme-editor.php' );

		$user_can_customize = current_user_can( 'customize' );

		if ( $user_can_customize ) {
			// If the user does not have the custom CSS option then present them with the CSS nudge upsell section instead.
			$custom_css_section = '1' === get_option( 'custom-design-upgrade' ) ? 'jetpack_custom_css' : 'css_nudge'; //phpcs:ignore
			$customize_custom_css_url = add_query_arg( array( 'autofocus' => array( 'section' => $custom_css_section ) ), $customize_url );
			add_submenu_page( 'themes.php', esc_attr__( 'Edit CSS', 'jetpack' ), __( 'Edit CSS', 'jetpack' ), 'customize', esc_url( $customize_custom_css_url ), null, 20 );
		}
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'list_users' ) ) {
			$submenus_to_update = array(
				'users.php'              => 'https://wordpress.com/people/team/' . $this->domain,
				'grofiles-editor'        => 'https://wordpress.com/me',
				'grofiles-user-settings' => 'https://wordpress.com/me/account',
			);
			$this->update_submenus( 'users.php', $submenus_to_update );
		} else {
			$submenus_to_update = array(
				'grofiles-editor'        => 'https://wordpress.com/me',
				'grofiles-user-settings' => 'https://wordpress.com/me/account',
			);
			$this->update_submenus( 'profile.php', $submenus_to_update );
		}
		add_submenu_page( 'users.php', esc_attr__( 'Add New', 'jetpack' ), __( 'Add New', 'jetpack' ), 'promote_users', 'https://wordpress.com/people/new/' . $this->domain, null, 1 );
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin_import Optional. Whether Import link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_export Optional. Whether Export link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin_import = false, $wp_admin_export = false ) {  // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Export on Simple sites is always handled on Calypso.
		parent::add_tools_menu( $wp_admin_import, false );
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_options_menu( $wp_admin = false ) {
		parent::add_options_menu( $wp_admin );

		add_submenu_page( 'options-general.php', esc_attr__( 'Hosting Configuration', 'jetpack' ), __( 'Hosting Configuration', 'jetpack' ), 'manage_options', 'https://wordpress.com/hosting-config/' . $this->domain, null, 6 );

		// Replace sharing menu if it exists. See Publicize_UI::sharing_menu.
		if ( remove_submenu_page( 'options-general.php', 'sharing' ) ) {
			add_submenu_page( 'options-general.php', esc_attr__( 'Sharing Settings', 'jetpack' ), __( 'Sharing', 'jetpack' ), 'publish_posts', 'https://wordpress.com/marketing/sharing-buttons/' . $this->domain, null, 30 );
		}
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_gutenberg_menus( $wp_admin = false ) {
		// Always remove the Gutenberg menu.
		remove_menu_page( 'gutenberg' );
		parent::add_gutenberg_menus( $wp_admin );
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

	/**
	 * Adds Plugins menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_plugins_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// TODO: Remove wpcom_menu (/wp-content/admin-plugins/wpcom-misc.php).
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
		add_menu_page( esc_attr__( 'Plugins', 'jetpack' ), sprintf( __( 'Plugins %s', 'jetpack' ), $count ), 'activate_plugins', 'plugins.php', null, 'dashicons-admin-plugins', 65 );

		// Plugins on Simple sites are always managed on Calypso.
		parent::add_plugins_menu( false );
	}
}
