<?php
/**
 * WP.com Admin Menu file.
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Masterbar\WPcom_Admin_Menu instead.
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
	 * Create the desired menu output.
	 *
	 * @deprecated $$next-version$$
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::reregister_menu_items' );
		parent::reregister_menu_items();
	}

	/**
	 * Get the preferred view for the given screen.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param string $screen Screen identifier.
	 * @param bool   $fallback_global_preference (Optional) Whether the global preference for all screens should be used
	 *                                           as fallback if there is no specific preference for the given screen.
	 *                                           Default: true.
	 * @return string
	 */
	public function get_preferred_view( $screen, $fallback_global_preference = true ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::get_preferred_view' );
		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Retrieve the number of blogs that the current user has.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @return int
	 */
	public function get_current_user_blog_count() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::get_current_user_blog_count' );
		return parent::get_current_user_blog_count();
	}

	/**
	 * Adds the site switcher link if user has more than one site.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_browse_sites_link() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_browse_sites_link' );
		parent::add_browse_sites_link();
	}

	/**
	 * Adds a custom element class for Site Switcher menu item.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_browse_sites_link_class( array $menu ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::set_browse_sites_link_class' );
		return parent::set_browse_sites_link_class( $menu );
	}

	/**
	 * Adds a link to the menu to create a new site.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_new_site_link() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_new_site_link' );
		parent::add_new_site_link();
	}

	/**
	 * Adds site card component.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_site_card_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_site_card_menu' );
		parent::add_site_card_menu();
	}

	/**
	 * Adds a custom element class and id for Site Card's menu item.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_site_card_menu_class( array $menu ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::set_site_card_menu_class' );
		return parent::set_site_card_menu_class( $menu );
	}

	/**
	 * Returns the first available upsell nudge.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::get_upsell_nudge' );
		return parent::get_upsell_nudge();
	}

	/**
	 * Adds Stats menu.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_stats_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_stats_menu' );
		parent::add_stats_menu();
	}

	/**
	 * Adds Upgrades menu.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_upgrades_menu' );
		parent::add_upgrades_menu( $plan );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_appearance_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_appearance_menu' );
		parent::add_appearance_menu();
	}

	/**
	 * Adds Users menu.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_users_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_users_menu' );
		parent::add_users_menu();
	}

	/**
	 * Adds Settings menu.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_options_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_options_menu' );
		parent::add_options_menu();
	}

	/**
	 * Adds My Home menu.
	 *
	 * @deprecated $$next-version$$
	 */
	public function add_my_home_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::add_my_home_menu' );
		parent::add_my_home_menu();
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 *
	 * @deprecated $$next-version$$
	 */
	public function remove_gutenberg_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::remove_gutenberg_menu' );
		parent::remove_gutenberg_menu();
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::should_link_to_wp_admin' );
		return parent::should_link_to_wp_admin();
	}

	/**
	 * Saves the sidebar state ( expanded / collapsed ) via an ajax request.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @return never
	 */
	public function ajax_sidebar_state() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::ajax_sidebar_state' );
		parent::ajax_sidebar_state();
	}

	/**
	 * Handle ajax requests to dismiss a just-in-time-message
	 *
	 * @deprecated $$next-version$$
	 */
	public function wp_ajax_jitm_dismiss() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::wp_ajax_jitm_dismiss' );
		parent::wp_ajax_jitm_dismiss();
	}

	/**
	 * Syncs the sidebar collapsed state from Calypso Preferences.
	 *
	 * @deprecated $$next-version$$
	 */
	public function sync_sidebar_collapsed_state() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::sync_sidebar_collapsed_state' );
		parent::sync_sidebar_collapsed_state();
	}

	/**
	 * Removes unwanted submenu items.
	 *
	 * These submenus are added across wp-content and should be removed together with these function calls.
	 *
	 * @deprecated $$next-version$$
	 */
	public function remove_submenus() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\WPcom_Admin_Menu::remove_submenus' );
		parent::remove_submenus();
	}
}
