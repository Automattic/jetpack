<?php
/**
 * Logout customizations for WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Log out from WordPress.com when logging out of the local site.
 */
function logout_atomic_user_from_wpcom() {
	// If this is a WordPress.com user connected to an Atomic site, log them out of wpcom.
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		do_action( 'wp_masterbar_logout', get_current_user_id() );
	}
}
add_action( 'clear_auth_cookie', 'logout_atomic_user_from_wpcom' );
