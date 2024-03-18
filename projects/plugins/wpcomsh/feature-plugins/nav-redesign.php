<?php
/**
 * Features related to the WordPress.com nav redesign.
 *
 * @package wpcomsh
 */

/**
 * Whether to enable the nav redesign.
 *
 * @return bool True if the nav redesign is enabled, false otherwise.
 */
function wpcom_is_nav_redesign_enabled() {
	$uses_wp_admin_interface      = get_option( 'wpcom_admin_interface' ) === 'wp-admin';
	$is_included_in_early_release = ! empty( get_option( 'wpcom_classic_early_release' ) );

	return $uses_wp_admin_interface && $is_included_in_early_release;
}
