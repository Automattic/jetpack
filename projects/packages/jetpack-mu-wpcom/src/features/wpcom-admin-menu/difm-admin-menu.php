<?php
/**
 * Menu registrations for DIFM sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Status;

/**
 * Replaces the admin menu with a simplified version on sites with DIFM in progress.
 */
function wpcom_register_difm_menus() {
	$domain = ( new Status() )->get_site_suffix();

	global $menu, $submenu;

	$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

	// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	add_menu_page( esc_attr__( 'Manage Domain', 'jetpack-mu-wpcom' ), __( 'Manage Domain', 'jetpack-mu-wpcom' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $domain . '/edit/' . $domain, null, 'dashicons-admin-settings' );

	if ( wpcom_site_has_feature( \WPCOM_Features::EMAIL_SUBSCRIPTION ) ) {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Manage Email', 'jetpack-mu-wpcom' ), __( 'Manage Email', 'jetpack-mu-wpcom' ), 'manage_options', 'https://wordpress.com/email/' . $domain . '/manage/' . $domain, null, 'dashicons-admin-settings' );
	}
	// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	add_menu_page( esc_attr__( 'Manage Purchases', 'jetpack-mu-wpcom' ), __( 'Manage Purchases', 'jetpack-mu-wpcom' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $domain, null, 'dashicons-cart' );
	// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	add_menu_page( esc_attr__( 'My Mailboxes', 'jetpack-mu-wpcom' ), __( 'My Mailboxes', 'jetpack-mu-wpcom' ), 'manage_options', 'https://wordpress.com/mailboxes/' . $domain, null, 'dashicons-email' );
}
add_action( 'admin_menu', 'wpcom_register_difm_menus', 99999 );
