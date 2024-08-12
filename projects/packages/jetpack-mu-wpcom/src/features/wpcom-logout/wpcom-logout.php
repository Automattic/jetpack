<?php
/**
 * Logout customizations for WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Maybe log out from WordPress.com when logging out of the local site.
 */
function maybe_logout_atomic_user_from_wpcom() {
	$user_id            = get_current_user_id();
	$is_atomic          = defined( 'IS_ATOMIC' ) && IS_ATOMIC;
	$connection_manager = new Connection_Manager( 'jetpack' );

	// If this is a WordPress.com user connected to an Atomic site, log them out of wpcom.
	if ( $is_atomic && $connection_manager->is_user_connected( $user_id ) ) {
		do_action( 'wp_masterbar_logout', $user_id );
	}
}
add_action( 'clear_auth_cookie', 'maybe_logout_atomic_user_from_wpcom' );
