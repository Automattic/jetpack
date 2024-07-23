<?php
/**
 * Jetpack Admin Menu file.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Jetpack_Admin_Menu instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Jetpack_Admin_Menu as Masterbar_Jetpack_Admin_Menu;

/**
 * Class Jetpack_Admin_Menu.
 */
class Jetpack_Admin_Menu extends Masterbar_Jetpack_Admin_Menu {

	/**
	 * Ensure that instantiating this class will trigger a deprecation warning.
	 *
	 * @since 13.7
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::__construct' );
		parent::__construct();
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::is_rtl' );
		return parent::is_rtl();
	}

	/**
	 * Create the desired menu output.
	 *
	 * @deprecated 13.7
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::reregister_menu_items' );
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::get_preferred_view' );
		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Get the Calypso or wp-admin link to CPT page.
	 *
	 * @deprecated 13.7
	 *
	 * @param object $ptype_obj The post type object.
	 * @return string The link to Calypso if SSO is enabled and the post_type
	 * supports rest or to WP Admin if SSO is disabled.
	 */
	public function get_cpt_menu_link( $ptype_obj ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::get_cpt_menu_link' );
		return parent::get_cpt_menu_link( $ptype_obj );
	}

	/**
	 * Adds Posts menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_posts_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_posts_menu' );
		parent::add_posts_menu();
	}

	/**
	 * Adds Media menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_media_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_media_menu' );
		parent::add_media_menu();
	}

	/**
	 * Adds Page menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_page_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_page_menu' );
		parent::add_page_menu();
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @deprecated 13.7
	 *
	 * @param string   $post_type Custom post type.
	 * @param int|null $position Optional. Position where to display the menu item. Default null.
	 */
	public function add_custom_post_type_menu( $post_type, $position = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_custom_post_type_menu' );
		parent::add_custom_post_type_menu( $post_type, $position );
	}

	/**
	 * Adds Comments menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_comments_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_comments_menu' );
		parent::add_comments_menu();
	}

	/**
	 * Adds Feedback menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_feedback_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_feedback_menu' );
		parent::add_feedback_menu();
	}

	/**
	 * Adds CPT menu items
	 *
	 * @deprecated 13.7
	 */
	public function add_cpt_menus() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_cpt_menus' );
		parent::add_cpt_menus();
	}

	/**
	 * Adds Jetpack menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_jetpack_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_jetpack_menu' );
		parent::add_jetpack_menu();
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @deprecated 13.7
	 *
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_appearance_menu' );
		return parent::add_appearance_menu();
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_plugins_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_plugins_menu' );
		parent::add_plugins_menu();
	}

	/**
	 * Adds Users menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_users_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_users_menu' );
		parent::add_users_menu();
	}

	/**
	 * Adds Tools menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_tools_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_tools_menu' );
		parent::add_tools_menu();
	}

	/**
	 * Adds Settings menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_options_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_options_menu' );
		parent::add_options_menu();
	}

	/**
	 * Adds WP Admin menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_wp_admin_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Jetpack_Admin_Menu::add_wp_admin_menu' );
		parent::add_wp_admin_menu();
	}
}
