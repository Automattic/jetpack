<?php
/**
 * Atomic Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class Atomic_Admin_Menu.
 */
class Atomic_Admin_Menu extends Admin_Menu {

	/**
	 * Atomic_Admin_Menu constructor.
	 */
	protected function __construct() {
		parent::__construct();

		add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
		add_action( 'admin_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );

		add_action(
			'admin_menu',
			function () {
				remove_action( 'admin_menu', 'gutenberg_menu', 9 );
			},
			0
		);
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
	 * Forces Posts menu to WPAdmin for Atomic sites only.
	 * Overloads `add_posts_menu` in parent class.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_posts_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return false; // return explicit `false` to force WPAdmin links.
	}

	/**
	 * Forces Pages menu to WPAdmin for Atomic sites only.
	 * Overloads `add_page_menu` in parent class.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_page_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return false; // return explicit `false` to force WPAdmin links.
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_plugins_menu( $wp_admin = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Plugins on Atomic sites are always managed on WP Admin.
		parent::add_plugins_menu( true );
	}

	/**
	 * Adds the site switcher link if user has more than one site.
	 */
	public function add_browse_sites_link() {
		$site_count = get_user_option( 'wpcom_site_count' );
		if ( ! $site_count || $site_count < 2 ) {
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
	 *
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
		$site_count = get_user_option( 'wpcom_site_count' );
		if ( $site_count && $site_count > 1 ) {
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

		$badge = '';
		if ( function_exists( 'site_is_private' ) && site_is_private() ) {
			$badge .= sprintf(
				'<span class="site__badge site__badge-private">%s</span>',
				site_is_coming_soon() ? esc_html__( 'Coming Soon', 'jetpack' ) : esc_html__( 'Private', 'jetpack' )
			);
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
	 *
	 * @return array
	 */
	public function set_site_card_menu_class( array $menu ) {
		foreach ( $menu as $key => $menu_item ) {
			if ( 'site-card' !== $menu_item[3] ) {
				continue;
			}

			$classes = ' toplevel_page_site-card';

			// webclip.png is the default on WoA sites. Anything other than that means we have a custom site icon.
			if ( has_site_icon() && 'https://s0.wp.com/i/webclip.png' !== get_site_icon_url( 512 ) ) {
				$classes .= ' has-site-icon';
			}

			$menu[ $key ][4] = $menu_item[4] . $classes;
			$menu[ $key ][5] = 'toplevel_page_site_card';
			break;
		}

		return $menu;
	}

	/**
	 * Adds Upgrades menu.
	 */
	public function add_upgrades_menu() {
		parent::add_upgrades_menu();

		add_submenu_page( 'paid-upgrades.php', __( 'Domains', 'jetpack' ), __( 'Domains', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, 10 );
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin_import Optional. Whether Import link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_export Optional. Whether Export link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin_import = false, $wp_admin_export = false ) {  // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Export on Atomic sites is always handled on WP Admin.
		parent::add_tools_menu( $wp_admin_import, true );
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_options_menu( $wp_admin = false ) {
		parent::add_options_menu( $wp_admin );

		add_submenu_page( 'options-general.php', esc_attr__( 'Hosting Configuration', 'jetpack' ), __( 'Hosting Configuration', 'jetpack' ), 'manage_options', 'https://wordpress.com/hosting-config/' . $this->domain, null, 6 );

		// No need to add a menu linking to WP Admin if there is already one.
		if ( ! $wp_admin ) {
			add_submenu_page( 'options-general.php', esc_attr__( 'Advanced General', 'jetpack' ), __( 'Advanced General', 'jetpack' ), 'manage_options', 'options-general.php' );
			add_submenu_page( 'options-general.php', esc_attr__( 'Advanced Writing', 'jetpack' ), __( 'Advanced Writing', 'jetpack' ), 'manage_options', 'options-writing.php' );
		}
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin_themes Optional. Whether Themes link should point to Calypso or wp-admin. Default false (Calypso).
	 * @param bool $wp_admin_customize Optional. Whether Customize link should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin_themes = false, $wp_admin_customize = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Customize on Atomic sites is always done on WP Admin.
		parent::add_appearance_menu( $wp_admin_themes, true );

		add_submenu_page( 'themes.php', esc_attr__( 'Add New Theme', 'jetpack' ), __( 'Add New Theme', 'jetpack' ), 'install_themes', 'theme-install.php', null, 1 );
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) {
		parent::add_users_menu( $wp_admin );

		add_submenu_page( 'users.php', esc_attr__( 'Advanced Users Management', 'jetpack' ), __( 'Advanced Users Management', 'jetpack' ), 'list_users', 'users.php', null, 2 );
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
}
