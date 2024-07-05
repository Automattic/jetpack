<?php
/**
 * Features related to the WordPress.com nav redesign.
 *
 * @package wpcomsh
 */

/**
 * Whether the current blog uses wp-admin as the admin interface style.
 *
 * @return bool Returns true if the blog uses wp-admin as the admin interface style, false otherwise.
 */
function uses_wp_admin_interface() {
	return get_option( 'wpcom_admin_interface' ) === 'wp-admin';
}

/**
 * Returns whether the current request is coming from the a8c proxy.
 */
function is_proxied() {
	return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
}
