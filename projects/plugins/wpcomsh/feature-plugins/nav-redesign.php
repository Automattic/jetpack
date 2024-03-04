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
	$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;

	$uses_wp_admin_interface      = get_option( 'wpcom_admin_interface' ) === 'wp-admin';
	$is_included_in_early_release = ! empty( get_option( 'wpcom_classic_early_release' ) );

	return $uses_wp_admin_interface && ( $is_proxied || $is_included_in_early_release );
}
add_filter( 'is_nav_redesign_enabled', 'wpcom_is_nav_redesign_enabled' );

/**
 * Temporarily override the `< WordPress.com` menu to link wpcalypso.wordpress.com,
 * which enables the nav redesign by default.
 */
function override_wpcom_menu_to_wpcalypso() {
	global $menu, $submenu;

	$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;

	if ( ! $is_proxied ) {
		return;
	}

	$wpcom_menu_position = 0;
	if ( isset( $menu[ $wpcom_menu_position ] ) ) {
		$menu[ $wpcom_menu_position ][2] = str_replace( 'https://wordpress.com/', 'https://wpcalypso.wordpress.com/', $menu[ $wpcom_menu_position ][2] ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	$parent_slug = 'wpcom-hosting-menu';

	foreach ( $submenu[ $parent_slug ] as &$menu_item ) {
		$menu_item[2] = str_replace( 'https://wordpress.com/', 'https://wpcalypso.wordpress.com/', $menu_item[2] );

	}
}
add_action( 'admin_menu', 'override_wpcom_menu_to_wpcalypso', PHP_INT_MAX );
