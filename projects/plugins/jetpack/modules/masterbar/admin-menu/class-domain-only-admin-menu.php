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
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		global $menu, $submenu;

		$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		add_menu_page( esc_attr__( 'Manage Domain', 'jetpack' ), __( 'Manage Domain', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain . '/edit/' . $this->domain, null, 'dashicons-admin-settings' );

		if ( function_exists( 'wpcom_site_has_feature' ) && wpcom_site_has_feature( \WPCOM_Features::EMAIL_SUBSCRIPTION ) ) {
			add_menu_page( esc_attr__( 'Manage Email', 'jetpack' ), __( 'Manage Email', 'jetpack' ), 'manage_options', 'https://wordpress.com/email/' . $this->domain . '/manage/' . $this->domain, null, 'dashicons-admin-settings' );
		}

		add_menu_page( esc_attr__( 'Manage Purchases', 'jetpack' ), __( 'Manage Purchases', 'jetpack' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 'dashicons-cart' );
		add_menu_page( esc_attr__( 'Inbox', 'jetpack' ), __( 'Inbox', 'jetpack' ), 'manage_options', 'https://wordpress.com/inbox/' . $this->domain, null, 'dashicons-email' );
	}
}
