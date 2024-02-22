<?php
/**
 * Features related to the WordPress.com nav redesign.
 *
 * @package wpcomsh
 */

/**
 * Whether to enable the nav redesign. Can be overridden by the `is_nav_redesign_enabled` filter.
 *
 * @return bool True if the nav redesign is enabled, false otherwise.
 */
function wpcom_is_nav_redesign_enabled() {
	$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;

	$uses_wp_admin_interface = get_option( 'wpcom_admin_interface' ) === 'wp-admin';

	return apply_filters( 'is_nav_redesign_enabled', $is_proxied && $uses_wp_admin_interface );
}

/**
 * Temporarily override the `< WordPress.com` menu to link wpcalypso.wordpress.com,
 * which enables the nav redesign by default.
 */
function override_wpcom_menu_to_wpcalypso() {
	global $menu;

	if ( ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	$wpcom_menu_position = 0;
	if ( isset( $menu[ $wpcom_menu_position ] ) ) {
		$wpcom_menu                   = $menu[ $wpcom_menu_position ];
		$wpcom_menu[2]                = str_replace( 'https://wordpress.com/', 'https://wpcalypso.wordpress.com/', $wpcom_menu[2] );
		$menu[ $wpcom_menu_position ] = $wpcom_menu; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}
}
add_action( 'admin_menu', 'override_wpcom_menu_to_wpcalypso', 99999 );
