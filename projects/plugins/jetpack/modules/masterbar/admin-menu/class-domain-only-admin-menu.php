<?php
/**
 * Domain-only sites Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-base-admin-menu.php';

/**
 * Class Domain_Only_Admin_Menu.
 */
class Domain_Only_Admin_Menu extends Base_Admin_Menu {

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * Options:
	 * false - Calypso (Default).
	 * true  - wp-admin.
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		return false;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		global $menu, $submenu;

		$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		add_menu_page( esc_attr__( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, 'dashicons-admin-settings' );
	}
}
