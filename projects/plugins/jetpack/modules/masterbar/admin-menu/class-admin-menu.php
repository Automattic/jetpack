<?php
/**
 * Admin Menu file.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Admin_Menu instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Admin_Menu as Masterbar_Admin_Menu;

/**
 * Class Admin_Menu.
 */
class Admin_Menu extends Masterbar_Admin_Menu {

	/**
	 * Ensure that instantiating this class will trigger a deprecation warning.
	 *
	 * @since 13.7
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::__construct' );
		parent::__construct();
	}

	/**
	 * Create the desired menu output.
	 *
	 * @deprecated 13.7
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::reregister_menu_items' );
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::get_preferred_view' );
		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Check if Links Manager is being used.
	 *
	 * @deprecated 13.7
	 */
	public function should_disable_links_manager() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::should_disable_links_manager' );
		return parent::should_disable_links_manager();
	}

	/**
	 * Adds My Home menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_my_home_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_my_home_menu' );
		parent::add_my_home_menu();
	}

	/**
	 * Adds My Mailboxes menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_my_mailboxes_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_my_mailboxes_menu' );
		parent::add_my_mailboxes_menu();
	}

	/**
	 * Adds Stats menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_stats_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_stats_menu' );
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_upgrades_menu' );
		parent::add_upgrades_menu( $plan );
	}

	/**
	 * Adds Posts menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_posts_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_posts_menu' );
		parent::add_posts_menu();
	}

	/**
	 * Adds Media menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_media_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_media_menu' );
		parent::add_media_menu();
	}

	/**
	 * Adds Page menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_page_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_page_menu' );
		parent::add_page_menu();
	}

	/**
	 * Adds Testimonials menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_testimonials_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_testimonials_menu' );
		parent::add_testimonials_menu();
	}

	/**
	 * Adds Portfolio menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_portfolio_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_portfolio_menu' );
		parent::add_portfolio_menu();
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $post_type Custom post type.
	 */
	public function add_custom_post_type_menu( $post_type ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_custom_post_type_menu' );
		parent::add_custom_post_type_menu( $post_type );
	}

	/**
	 * Adds Comments menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_comments_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_comments_menu' );
		parent::add_comments_menu();
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @deprecated 13.7
	 *
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_appearance_menu' );
		return parent::add_appearance_menu();
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_plugins_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_plugins_menu' );
		parent::add_plugins_menu();
	}

	/**
	 * Adds Users menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_users_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_users_menu' );
		parent::add_users_menu();
	}

	/**
	 * Adds Tools menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_tools_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_tools_menu' );
		parent::add_tools_menu();
	}

	/**
	 * Adds Settings menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_options_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_options_menu' );
		parent::add_options_menu();
	}

	/**
	 * Create Jetpack menu.
	 *
	 * @deprecated 13.7
	 *
	 * @param int  $position  Menu position.
	 * @param bool $separator Whether to add a separator before the menu.
	 */
	public function create_jetpack_menu( $position = 50, $separator = true ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::create_jetpack_menu' );
		parent::create_jetpack_menu( $position, $separator );
	}

	/**
	 * Adds Jetpack menu.
	 *
	 * @deprecated 13.7
	 */
	public function add_jetpack_menu() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_jetpack_menu' );
		parent::add_jetpack_menu();
	}

	/**
	 * Add the calypso /woocommerce-installation/ menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $current_plan The site's plan if they have one. This is passed from WPcom_Admin_Menu to prevent
	 * redundant database queries.
	 */
	public function add_woocommerce_installation_menu( $current_plan = null ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::add_woocommerce_installation_menu' );
		parent::add_woocommerce_installation_menu( $current_plan );
	}

	/**
	 * AJAX handler for retrieving the upsell nudge.
	 *
	 * @deprecated 13.7
	 */
	public function wp_ajax_upsell_nudge_jitm() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::wp_ajax_upsell_nudge_jitm' );
		parent::wp_ajax_upsell_nudge_jitm();
	}

	/**
	 * Returns the first available upsell nudge.
	 * Needs to be implemented separately for each child menu class.
	 * Empty by default.
	 *
	 * @deprecated 13.7
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Menu::get_upsell_nudge' );
		return parent::get_upsell_nudge();
	}
}
