<?php
/**
 * WP.com Admin Menu file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Jetpack_Custom_CSS;
use JITM;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class WPcom_Admin_Menu.
 */
class WPcom_Admin_Menu extends Admin_Menu {
	/**
	 * Holds the current plan, set by get_current_plan().
	 *
	 * @var array
	 */
	private $current_plan = array();

	/**
	 * WPcom_Admin_Menu constructor.
	 */
	protected function __construct() {
		parent::__construct();

		add_action( 'wp_ajax_sidebar_state', array( $this, 'ajax_sidebar_state' ) );
		add_action( 'wp_ajax_jitm_dismiss', array( $this, 'wp_ajax_jitm_dismiss' ) );
		add_action( 'wp_ajax_upsell_nudge_jitm', array( $this, 'wp_ajax_upsell_nudge_jitm' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'wpcom_upsell_nudge_jitm_fix' ) );
		add_action( 'admin_init', array( $this, 'sync_sidebar_collapsed_state' ) );
		add_action( 'admin_menu', array( $this, 'remove_submenus' ), 140 ); // After hookpress hook at 130.
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();

		$this->remove_gutenberg_menu();

		// Not needed outside of wp-admin.
		if ( ! $this->is_api_request ) {
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
	 * Retrieve the number of blogs that the current user has.
	 *
	 * @return int
	 */
	public function get_current_user_blog_count() {
		if ( function_exists( '\get_blog_count_for_user' ) ) {
			return \get_blog_count_for_user( get_current_user_id() );
		}

		$blogs = get_blogs_of_user( get_current_user_id() );
		return is_countable( $blogs ) ? count( $blogs ) : 0;
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
		if ( $this->get_current_user_blog_count() > 1 ) {
			return;
		}

		$this->add_admin_menu_separator();
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( __( 'Add New Site', 'jetpack-masterbar' ), __( 'Add New Site', 'jetpack-masterbar' ), 'read', 'https://wordpress.com/start?ref=calypso-sidebar', null, 'dashicons-plus-alt' );
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
				'tracks_impression_event_name' => $message->tracks['display']['name'] ?? null,
				'tracks_impression_cta_name'   => $message->tracks['display']['props']['cta_name'] ?? null,
				'tracks_click_event_name'      => $message->tracks['click']['name'] ?? null,
				'tracks_click_cta_name'        => $message->tracks['click']['props']['cta_name'] ?? null,
				'dismissible'                  => $message->is_dismissible,
				'feature_class'                => $message->feature_class,
				'id'                           => $message->id,
			);
		}
	}

	/**
	 * Gets the current plan and stores it in $this->current_plan so the database is only called once per request.
	 *
	 * @return array
	 */
	private function get_current_plan() {
		if ( empty( $this->current_plan ) && class_exists( 'WPCOM_Store_API' ) ) {
			$this->current_plan = \WPCOM_Store_API::get_current_plan( get_current_blog_id() );
		}
		return $this->current_plan;
	}

	/**
	 * Adds Upgrades menu.
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {
		$current_plan = $this->get_current_plan();
		if ( ! empty( $current_plan['product_name_short'] ) ) {
			$plan = $current_plan['product_name_short'];
		}

		parent::add_upgrades_menu( $plan );

		$last_upgrade_submenu_position = $this->get_submenu_item_count( 'paid-upgrades.php' );

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'paid-upgrades.php', __( 'Domains', 'jetpack-masterbar' ), __( 'Domains', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, $last_upgrade_submenu_position - 1 );

		/** This filter is already documented in modules/masterbar/admin-menu/class-atomic-admin-menu.php */
		if ( apply_filters( 'jetpack_show_wpcom_upgrades_email_menu', false ) ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'paid-upgrades.php', __( 'Emails', 'jetpack-masterbar' ), __( 'Emails', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/email/' . $this->domain, null, $last_upgrade_submenu_position );
		}

		if ( defined( 'WPCOM_ENABLE_ADD_ONS_MENU_ITEM' ) && WPCOM_ENABLE_ADD_ONS_MENU_ITEM ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'paid-upgrades.php', __( 'Add-Ons', 'jetpack-masterbar' ), __( 'Add-Ons', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/add-ons/' . $this->domain, null, 1 );
		}
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu() {
		$customize_url = parent::add_appearance_menu();

		$this->hide_submenu_page( 'themes.php', 'theme-editor.php' );

		$user_can_customize = current_user_can( 'customize' );

		if ( wp_is_block_theme() ) {
			add_filter( 'safecss_is_freetrial', '__return_false', PHP_INT_MAX );
			if ( class_exists( 'Jetpack_Custom_CSS' ) && empty( Jetpack_Custom_CSS::get_css() ) ) {
				$user_can_customize = false;
			}
			remove_filter( 'safecss_is_freetrial', '__return_false', PHP_INT_MAX );
		}

		if ( $user_can_customize ) {
			$customize_custom_css_url = add_query_arg( array( 'autofocus' => array( 'section' => 'jetpack_custom_css' ) ), $customize_url );
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'themes.php', esc_attr__( 'Additional CSS', 'jetpack-masterbar' ), __( 'Additional CSS', 'jetpack-masterbar' ), 'customize', esc_url( $customize_custom_css_url ), null, 20 );
		}

		return $customize_url;
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
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'users.php', esc_attr__( 'Add New User', 'jetpack-masterbar' ), __( 'Add New User', 'jetpack-masterbar' ), 'promote_users', 'https://wordpress.com/people/new/' . $this->domain, null, 1 );
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 */
	public function remove_gutenberg_menu() {
		// Always remove the Gutenberg menu.
		remove_menu_page( 'gutenberg' );
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
	 * Saves the sidebar state ( expanded / collapsed ) via an ajax request.
	 *
	 * @return never
	 */
	public function ajax_sidebar_state() {
		$expanded    = isset( $_REQUEST['expanded'] ) ? filter_var( wp_unslash( $_REQUEST['expanded'] ), FILTER_VALIDATE_BOOLEAN ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
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

		die( 0 );
	}

	/**
	 * Handle ajax requests to dismiss a just-in-time-message
	 */
	public function wp_ajax_jitm_dismiss() {
		check_ajax_referer( 'jitm_dismiss' );
		require_lib( 'jetpack-jitm/jitm-engine' );
		if ( isset( $_REQUEST['id'] ) && isset( $_REQUEST['feature_class'] ) ) {
			JITM\Engine::dismiss( sanitize_text_field( wp_unslash( $_REQUEST['id'] ) ), sanitize_text_field( wp_unslash( $_REQUEST['feature_class'] ) ) );
		}
		wp_die();
	}

	/**
	 * Syncs the sidebar collapsed state from Calypso Preferences.
	 */
	public function sync_sidebar_collapsed_state() {
		$calypso_preferences = get_user_attribute( get_current_user_id(), 'calypso_preferences' );

		$sidebar_collapsed = $calypso_preferences['sidebarCollapsed'] ?? false;

		// Read the current stored setting and convert it to boolean in order to be able to compare the values later.
		$current_sidebar_collapsed_setting = 'f' === get_user_setting( 'mfold' );

		// Only set the setting if the value differs, as `set_user_setting` always updates at least the timestamp
		// which leads to unnecessary user meta cache purging on all wp-admin screen requests.
		if ( $current_sidebar_collapsed_setting !== $sidebar_collapsed ) {
			set_user_setting( 'mfold', $sidebar_collapsed ? 'f' : 'o' );
		}
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
