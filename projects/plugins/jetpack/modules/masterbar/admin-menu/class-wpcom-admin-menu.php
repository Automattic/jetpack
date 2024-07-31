<?php
/**
 * WP.com Admin Menu file.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\WPcom_Admin_Menu instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\WPcom_Admin_Menu as Masterbar_WPcom_Admin_Menu;

/**
 * Class WPcom_Admin_Menu.
 */
class WPcom_Admin_Menu extends Masterbar_WPcom_Admin_Menu {

	/**
	 * Ensure that instantiating this class will trigger a deprecation warning.
	 *
	 * @since 13.7
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::__construct' );
		parent::__construct();
	}

	/**
	 * Create the desired menu output.
	 *
	 * @deprecated 13.7
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::reregister_menu_items' );
		parent::reregister_menu_items();
	}

	/**
	 * Get the preferred view for the given screen.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $screen Screen identifier.
	 * @param bool   $fallback_global_preference (Optional) Whether the global preference for all screens should be used
	 *                                           as fallback if there is no specific preference for the given screen.
	 *                                           Default: true.
	 * @return string
	 */
	public function get_preferred_view( $screen, $fallback_global_preference = true ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::get_preferred_view' );
		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Retrieve the number of blogs that the current user has.
	 *
	 * @deprecated 13.7
	 *
	 * @return int
	 */
	public function get_current_user_blog_count() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::get_current_user_blog_count' );
		return parent::get_current_user_blog_count();
	}

	/**
	 * Adds a custom element class for Site Switcher menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_browse_sites_link_class( array $menu ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::set_browse_sites_link_class' );
		return parent::set_browse_sites_link_class( $menu );
	}

	/**
	 * Adds a link to the menu to create a new site.
	 *
	 * @deprecated 13.7
	 */
	public function add_new_site_link() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_new_site_link' );
		parent::add_new_site_link();
	}

	/**
	 * Adds site card component.
	 *
	 * @deprecated 13.7
	 */
	public function add_site_card_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_site_card_menu' );
		parent::add_site_card_menu();
	}

	/**
	 * Adds a custom element class and id for Site Card's menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_site_card_menu_class( array $menu ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::set_site_card_menu_class' );
		return parent::set_site_card_menu_class( $menu );
	}

	/**
	 * Returns the first available upsell nudge.
	 *
	 * @deprecated 13.7
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::get_upsell_nudge' );
		return parent::get_upsell_nudge();
	}

	/**
	 * Adds Stats menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_stats_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_stats_menu' );
		parent::add_stats_menu();
	}

	/**
	 * Adds Upgrades menu.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_upgrades_menu' );
		parent::add_upgrades_menu( $plan );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_appearance_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_appearance_menu' );
		return parent::add_appearance_menu();
	}

	/**
	 * Adds Users menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_users_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_users_menu' );
		parent::add_users_menu();
	}

	/**
	 * Adds Settings menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_options_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_options_menu' );
		parent::add_options_menu();
	}

	/**
	 * Adds My Home menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_my_home_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_my_home_menu' );
		parent::add_my_home_menu();
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 *
	 * @deprecated 13.7
	 */
	public function remove_gutenberg_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::remove_gutenberg_menu' );
		parent::remove_gutenberg_menu();
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * @deprecated 13.7
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::should_link_to_wp_admin' );
		return parent::should_link_to_wp_admin();
	}

	/**
	 * Saves the sidebar state ( expanded / collapsed ) via an ajax request.
	 *
	 * @deprecated 13.7
	 *
	 * @return never
	 */
	public function ajax_sidebar_state() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::ajax_sidebar_state' );
		parent::ajax_sidebar_state();
	}

	/**
	 * Handle ajax requests to dismiss a just-in-time-message
	 *
	 * @deprecated 13.7
	 */
	public function wp_ajax_jitm_dismiss() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::wp_ajax_jitm_dismiss' );
		parent::wp_ajax_jitm_dismiss();
	}

	/**
	 * Syncs the sidebar collapsed state from Calypso Preferences.
	 *
	 * @deprecated 13.7
	 */
	public function sync_sidebar_collapsed_state() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::sync_sidebar_collapsed_state' );
		parent::sync_sidebar_collapsed_state();
	}

	/**
	 * Removes unwanted submenu items.
	 *
	 * These submenus are added across wp-content and should be removed together with these function calls.
	 *
	 * @deprecated 13.7
	 */
	public function remove_submenus() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::remove_submenus' );
		parent::remove_submenus();
	}
}
