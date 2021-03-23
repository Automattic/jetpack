<?php
/**
 * Hotfixes for Nav Unification feature, due to Jetpack monthly release cycle.
 * Each hotfix should declare when it is safe to be removed.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Status;

 /**
 * Makes Calypso Users menu always visible in Atomic.
 * Can be removed after Jetpack 9.6 release.
 */
function wpcomsh_add_calypso_users_menu() {
	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Do not clash with the fix already shipped in Jetpack 9.6.
	if ( version_compare( JETPACK__VERSION, '9.6-alpha', '>=' ) ) {
		return;
	}
	
	// Safety - don't alter anything if Nav Unification is not enabled.
	if ( ! wpcomsh_activate_nav_unification( false ) ) {
		return;
	}

	// Whether Advanced Dashboard toggle is enabled.
	$wp_admin = get_user_option( 'jetpack_admin_menu_link_destination' );;

	if ( $wp_admin ) {
		$site_domain  = ( new Status() )->get_site_suffix();
		$submenus_to_update = array(
			'user-new.php' => 'https://wordpress.com/people/new/' . $site_domain,
			'users.php'    => 'https://wordpress.com/people/team/' . $site_domain,
		);

		wpcomsh_update_submenus( 'users.php', $submenus_to_update );

		add_submenu_page( 'users.php', esc_attr__( 'Advanced Users Management', 'jetpack' ), __( 'Advanced Users Management', 'jetpack' ), 'list_users', 'users.php', null, 2 );
	}

}
add_action( 'admin_menu', 'wpcomsh_add_calypso_users_menu' );


/**
 * Helper function used only in this file.
 * Can be removed if no other function here uses it.
 *
 * Updates the submenus of the given menu slug.
 * This is a copy from Jetpack: projects/plugins/jetpack/modules/masterbar/admin-menu/class-admin-menu.php
 *
 * @param string $slug Menu slug.
 * @param array  $submenus_to_update Array of new submenu slugs.
 */
function wpcomsh_update_submenus( $slug, $submenus_to_update ) {
	global $submenu;

	if ( ! isset( $submenu[ $slug ] ) ) {
		return;
	}

	foreach ( $submenu[ $slug ] as $i => $submenu_item ) {
		if ( array_key_exists( $submenu_item[2], $submenus_to_update ) ) {
			$submenu_item[2] = $submenus_to_update[ $submenu_item[2] ];
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$submenu[ $slug ][ $i ] = $submenu_item;
		}
	}
}
