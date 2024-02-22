<?php
/**
 * WordPress.com Site Menu
 *
 * Add's a WordPress.com menu item to the admin menu linking back to the sites WordPress.com home page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Add a WordPress.com menu item to the wp-admin sidebar menu.
 */
function wpcom_add_wpcom_menu_item() {
	if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );
		add_menu_page(
			esc_attr__( 'WordPress.com', 'jetpack-mu-wpcom' ),
			esc_attr__( 'WordPress.com', 'jetpack-mu-wpcom' ),
			'manage_options',
			"https://wordpress.com/home/$domain",
			null,
			'dashicons-arrow-left-alt2',
			0
		);

		// Position a separator below the WordPress.com menu item.
		// Inspired by https://github.com/Automattic/jetpack/blob/b6b6e86c5491869782857141ca48168dfa195635/projects/plugins/jetpack/modules/masterbar/admin-menu/class-base-admin-menu.php#L239
		global $menu;
		$separator = array(
			'',                                  // Menu title (ignored).
			'manage_options',                    // Required capability.
			wp_unique_id( 'separator-custom-' ), // URL or file (ignored, but must be unique).
			'',                                  // Page title (ignored).
			'wp-menu-separator',                 // CSS class. Identifies this item as a separator.
		);
		$position  = 0;
		if ( isset( $menu[ "$position" ] ) ) {
			$position            = $position + substr( base_convert( md5( $separator[2] . $separator[0] ), 16, 10 ), -5 ) * 0.00001;
			$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		} else {
			$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}
}
add_action( 'admin_menu', 'wpcom_add_wpcom_menu_item' );
