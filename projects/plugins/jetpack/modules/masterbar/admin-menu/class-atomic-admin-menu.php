<?php
/**
 * Atomic Admin Menu file.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Atomic_Admin_Menu instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Atomic_Admin_Menu as Masterbar_Atomic_Admin_Menu;

/**
 * Class Atomic_Admin_Menu.
 */
class Atomic_Admin_Menu extends Masterbar_Atomic_Admin_Menu {

	/**
	 * Ensure that instantiating this class will trigger a deprecation warning.
	 *
	 * @since 13.7
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::__construct' );
		parent::__construct();
	}

	/**
	 * Dequeues unnecessary scripts.
	 *
	 * @deprecated 13.7
	 */
	public function dequeue_scripts() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::dequeue_scripts' );
		parent::dequeue_scripts();
	}

	/**
	 * Determines whether the current locale is right-to-left (RTL).
	 *
	 * Performs the check against the current locale set on the WordPress.com's account settings.
	 * See `Masterbar::__construct` in `modules/masterbar/masterbar/class-masterbar.php`.
	 *
	 * @deprecated 13.7
	 */
	public function is_rtl() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::is_rtl' );
		return parent::is_rtl();
	}

	/**
	 * Create the desired menu output.
	 *
	 * @deprecated 13.7
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::reregister_menu_items' );
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::get_preferred_view' );
		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Adds Users menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_users_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_users_menu' );
		parent::add_users_menu();
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_plugins_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_plugins_menu' );
		parent::add_plugins_menu();
	}

	/**
	 * Adds a custom element class for Site Switcher menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $menu Associative array of administration menu items.
	 *
	 * @return array
	 */
	public function set_browse_sites_link_class( array $menu ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::set_browse_sites_link_class' );
		return parent::set_browse_sites_link_class( $menu );
	}

	/**
	 * Adds a link to the menu to create a new site.
	 *
	 * @deprecated 13.7
	 */
	public function add_new_site_link() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_new_site_link' );
		parent::add_new_site_link();
	}

	/**
	 * Adds site card component.
	 *
	 * @deprecated 13.7
	 */
	public function add_site_card_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_site_card_menu' );
		parent::add_site_card_menu();
	}

	/**
	 * Adds a custom element class and id for Site Card's menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $menu Associative array of administration menu items.
	 *
	 * @return array
	 */
	public function set_site_card_menu_class( array $menu ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::set_site_card_menu_class' );
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::get_upsell_nudge' );
		return parent::get_upsell_nudge();
	}

	/**
	 * Adds Jetpack menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_jetpack_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_jetpack_menu' );
		parent::add_jetpack_menu();
	}

	/**
	 * Adds Stats menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_stats_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_stats_menu' );
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_upgrades_menu' );
		parent::add_upgrades_menu( $plan );
	}

	/**
	 * Adds Settings menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_options_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_options_menu' );
		parent::add_options_menu();
	}

	/**
	 * Adds Tools menu entries.
	 *
	 * @deprecated 13.7
	 */
	public function add_tools_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_tools_menu' );
		parent::add_tools_menu();
	}

	/**
	 * Override the global submenu_file for theme-install.php page so the WP Admin menu item gets highlighted correctly.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $submenu_file The current pages $submenu_file global variable value.
	 * @return string | null
	 */
	public function override_the_theme_installer( $submenu_file ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::override_the_theme_installer' );
		return parent::override_the_theme_installer( $submenu_file );
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 *
	 * @deprecated 13.7
	 */
	public function remove_gutenberg_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::remove_gutenberg_menu' );
		parent::remove_gutenberg_menu();
	}

	/**
	 * Saves the sidebar state ( expanded / collapsed ) via an ajax request.
	 *
	 * @deprecated 13.7
	 */
	public function ajax_sidebar_state() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::ajax_sidebar_state' );
		parent::ajax_sidebar_state();
	}

	/**
	 * Handle ajax requests to dismiss a just-in-time-message
	 *
	 * @deprecated 13.7
	 */
	public function wp_ajax_jitm_dismiss() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::wp_ajax_jitm_dismiss' );
		parent::wp_ajax_jitm_dismiss();
	}

	/**
	 * Adds a notice above each settings page while using the Classic view to indicate
	 * that the Default view offers more features. Links to the default view.
	 *
	 * @deprecated 13.7
	 *
	 * @return void
	 */
	public function add_settings_page_notice() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Admin_Menu::add_settings_page_notice' );
		parent::add_settings_page_notice();
	}
}
