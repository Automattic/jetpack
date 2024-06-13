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
	$uses_wp_admin_interface = get_option( 'wpcom_admin_interface' ) === 'wp-admin';

	return $uses_wp_admin_interface;
}

/**
 * Returns whether the current request is coming from the a8c proxy.
 */
function is_proxied() {
	return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
		? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
		: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
}

/**
 * Temporarily hides the Hosting menus that are already in GSV.
 */
function temporarily_hide_hosting_menus_already_in_global_site_view() {
	global $submenu;

	if ( ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	$items_to_hide = array( 'hosting-config', 'site-monitoring' );

	foreach ( $submenu['wpcom-hosting-menu'] as &$menu_item ) {
		foreach ( $items_to_hide  as $item_to_hide ) {
			if ( str_starts_with( $menu_item[2], 'https://wordpress.com/' . $item_to_hide ) ) {
				remove_submenu_page( 'wpcom-hosting-menu', $menu_item[2] );
				break;
			}
		}
	}
}
add_action( 'admin_menu', 'temporarily_hide_hosting_menus_already_in_global_site_view', PHP_INT_MAX );
