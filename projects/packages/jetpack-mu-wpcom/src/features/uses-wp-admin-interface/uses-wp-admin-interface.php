<?php
/**
 * Features related to the WordPress.com nav redesign.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Whether the current blog uses wp-admin as the admin interface style.
 *
 * @return bool Returns true if the blog uses wp-admin as the admin interface style, false otherwise.
 */
function uses_wp_admin_interface() {
	return get_option( 'wpcom_admin_interface' ) === 'wp-admin';
}
