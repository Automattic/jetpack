<?php
/**
 * WP.com Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use JITM;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class WPcom_Admin_Menu.
 */
class WPcom_Admin_Menu extends Admin_Menu {
	/**
	 * WPcom_Admin_Menu constructor.
	 */
	protected function __construct() {
		parent::__construct();

		add_action( 'wp_ajax_sidebar_state', array( $this, 'ajax_sidebar_state' ) );
		add_action( 'admin_init', array( $this, 'sync_sidebar_collapsed_state' ) );
		add_action( 'admin_menu', array( $this, 'remove_submenus' ), 140 ); // After hookpress hook at 130.
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
			$nudge = $this->get_upsell_nudge();
			if ( $nudge ) {
				parent::add_upsell_nudge( $nudge );
			}
			$this->add_new_site_link();
		}

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
	public function get_preferred_view( $screen, $fallback_global_preference = true ) {
		// When no preferred view has been set for Themes, keep the previous behavior that forced the default view
		// regardless of the global preference.
		if ( $fallback_global_preference && 'themes.php' === $screen ) {
			$preferred_view = parent::get_preferred_view( $screen, false );
			if ( self::UNKNOWN_VIEW === $preferred_view ) {
				return self::DEFAULT_VIEW;
			}
			return $preferred_view;
		}

		// Plugins on Simple sites are always managed on Calypso.
		if ( 'plugins.php' === $screen ) {
			return self::DEFAULT_VIEW;
		}

		return parent::get_preferred_view( $screen, $fallback_global_preference );
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
		add_menu_page( __( 'Add New Site', 'jetpack' ), __( 'Add New Site', 'jetpack' ), 'read', 'https://wordpress.com/start?ref=calypso-sidebar', null, 'dashicons-plus-alt' );
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

		if ( function_exists( 'is_simple_site_redirect' ) && is_simple_site_redirect( $this->domain ) ) {
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
	 * Returns the first available upsell nudge.
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		require_lib( 'jetpack-jitm/jitm-engine' );
		$jitm_engine = new JITM\Engine();

		$message_path = 'calypso:sites:sidebar_notice';
		$current_user = wp_get_current_user();
		$user_id      = $current_user->ID;
		$user_roles   = implode( ',', $current_user->roles );
		$query_string = array(
			'message_path' => $message_path,
		);

		// Get the top message only.
		$message = $jitm_engine->get_top_messages( $message_path, $user_id, $user_roles, $query_string );

		if ( isset( $message[0] ) ) {
			$message = $message[0];
			return array(
				'content'                      => $message->content['message'],
				'cta'                          => $message->CTA['message'], // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'link'                         => $message->CTA['link'], // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'tracks_impression_event_name' => $message->tracks['display']['name'],
				'tracks_impression_cta_name'   => $message->tracks['display']['props']['cta_name'],
				'tracks_click_event_name'      => $message->tracks['click']['name'],
				'tracks_click_cta_name'        => $message->tracks['click']['props']['cta_name'],
			);
		}
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
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {
		if ( class_exists( 'WPCOM_Store_API' ) ) {
			$products = \WPCOM_Store_API::get_current_plan( get_current_blog_id() );
			if ( array_key_exists( 'product_name_short', $products ) ) {
				$plan = $products['product_name_short'];
			}
		}
		parent::add_upgrades_menu( $plan );

		$last_upgrade_submenu_position = $this->get_submenu_item_count( 'paid-upgrades.php' );

		add_submenu_page( 'paid-upgrades.php', __( 'Domains', 'jetpack' ), __( 'Domains', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, $last_upgrade_submenu_position - 1 );

		/** This filter is already documented in modules/masterbar/admin-menu/class-atomic-admin-menu.php */
		if ( apply_filters( 'jetpack_show_wpcom_upgrades_email_menu', false ) ) {
			add_submenu_page( 'paid-upgrades.php', __( 'Emails', 'jetpack' ), __( 'Emails', 'jetpack' ), 'manage_options', 'https://wordpress.com/email/' . $this->domain, null, $last_upgrade_submenu_position );
		}
	}

	/**
	 * Adds Appearance menu.
	 */
	public function add_appearance_menu() {
		$customize_url = parent::add_appearance_menu();

		$this->hide_submenu_page( 'themes.php', 'theme-editor.php' );

		$user_can_customize = current_user_can( 'customize' );

		if ( $user_can_customize ) {
			$customize_custom_css_url = add_query_arg( array( 'autofocus' => array( 'section' => 'jetpack_custom_css' ) ), $customize_url );
			add_submenu_page( 'themes.php', esc_attr__( 'Additional CSS', 'jetpack' ), __( 'Additional CSS', 'jetpack' ), 'customize', esc_url( $customize_custom_css_url ), null, 20 );
		}
	}

	/**
	 * Adds Users menu.
	 */
	public function add_users_menu() {
		$submenus_to_update = array(
			'grofiles-editor'        => 'https://wordpress.com/me',
			'grofiles-user-settings' => 'https://wordpress.com/me/account',
		);

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'users.php' ) ) {
			$submenus_to_update['users.php'] = 'https://wordpress.com/people/team/' . $this->domain;
		}

		$slug = current_user_can( 'list_users' ) ? 'users.php' : 'profile.php';
		$this->update_submenus( $slug, $submenus_to_update );
		add_submenu_page( 'users.php', esc_attr__( 'Add New', 'jetpack' ), __( 'Add New', 'jetpack' ), 'promote_users', 'https://wordpress.com/people/new/' . $this->domain, null, 1 );
	}

	/**
	 * Adds Settings menu.
	 */
	public function add_options_menu() {
		parent::add_options_menu();

		add_submenu_page( 'options-general.php', esc_attr__( 'Hosting Configuration', 'jetpack' ), __( 'Hosting Configuration', 'jetpack' ), 'manage_options', 'https://wordpress.com/hosting-config/' . $this->domain, null, 10 );
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 */
	public function add_gutenberg_menus() {
		// Always remove the Gutenberg menu.
		remove_menu_page( 'gutenberg' );
		parent::add_gutenberg_menus();
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
	 */
	public function add_plugins_menu() {
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

		parent::add_plugins_menu();
	}

	/**
	 * Saves the sidebar state ( expanded / collapsed ) via an ajax request.
	 */
	public function ajax_sidebar_state() {
		$expanded    = filter_var( $_REQUEST['expanded'], FILTER_VALIDATE_BOOLEAN ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$user_id     = get_current_user_id();
		$preferences = get_user_attribute( $user_id, 'calypso_preferences' );
		if ( empty( $preferences ) ) {
			$preferences = array();
		}

		$value = array_merge( (array) $preferences, array( 'sidebarCollapsed' => ! $expanded ) );
		$value = array_filter(
			$value,
			function ( $preference ) {
				return null !== $preference;
			}
		);

		update_user_attribute( $user_id, 'calypso_preferences', $value );

		die();
	}

	/**
	 * Syncs the sidebar collapsed state from Calypso Preferences.
	 */
	public function sync_sidebar_collapsed_state() {
		$calypso_preferences = get_user_attribute( get_current_user_id(), 'calypso_preferences' );

		$sidebar_collapsed = isset( $calypso_preferences['sidebarCollapsed'] ) ? $calypso_preferences['sidebarCollapsed'] : false;
		set_user_setting( 'mfold', $sidebar_collapsed ? 'f' : 'o' );
	}

	/**
	 * Removes unwanted submenu items.
	 *
	 * These submenus are added across wp-content and should be removed together with these function calls.
	 */
	public function remove_submenus() {
		global $_registered_pages;

		remove_submenu_page( 'index.php', 'akismet-stats' );
		remove_submenu_page( 'index.php', 'my-comments' );
		remove_submenu_page( 'index.php', 'stats' );
		remove_submenu_page( 'index.php', 'subscriptions' );

		/* @see https://github.com/Automattic/wp-calypso/issues/49210 */
		remove_submenu_page( 'index.php', 'my-blogs' );
		$_registered_pages['admin_page_my-blogs'] = true; // phpcs:ignore

		remove_submenu_page( 'paid-upgrades.php', 'premium-themes' );
		remove_submenu_page( 'paid-upgrades.php', 'domains' );
		remove_submenu_page( 'paid-upgrades.php', 'my-upgrades' );
		remove_submenu_page( 'paid-upgrades.php', 'billing-history' );

		remove_submenu_page( 'themes.php', 'customize.php?autofocus[panel]=amp_panel&return=' . rawurlencode( admin_url() ) );

		remove_submenu_page( 'users.php', 'wpcom-invite-users' ); // Wpcom_Invite_Users::action_admin_menu.

		remove_submenu_page( 'options-general.php', 'adcontrol' );

		// Remove menu item but continue allowing access.
		foreach ( array( 'openidserver', 'webhooks' ) as $page_slug ) {
			remove_submenu_page( 'options-general.php', $page_slug );
			$_registered_pages[ 'admin_page_' . $page_slug ] = true; // phpcs:ignore
		}
	}
}
