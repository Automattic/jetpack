<?php
/**
 * Logout customizations for WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Log out Atomic WordPress.com users from WPCOM when they logout from a local site.
 */
function logout_atomic_user_from_wpcom() {
	$connection_manager = new Connection_Manager();
	$wpcom_user_data    = $connection_manager->get_connected_user_data( get_current_user_id() );
	$has_wpcom_account  = isset( $wpcom_user_data['ID'] );

	if ( $has_wpcom_account && defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		// In some circustances get_current_user_id() returns the local user ID.
		// The $wpcom_user_data['ID'] is always the WordPress.com user ID.
		do_action( 'wp_masterbar_logout', $wpcom_user_data['ID'] );
	}
}
add_action( 'clear_auth_cookie', 'logout_atomic_user_from_wpcom' );
