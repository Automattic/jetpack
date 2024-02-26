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
 *
 * Of note, we need the $parent_slug so that we can link the submenu items to the parent menu item. Using a URL
 * for the slug doesn't appear to work when registering submenus. Because we use the parent slug in the top
 * level menu item, we need to find a solution to link that menu out to WordPress.com.
 *
 * We accomplish this by:
 *
 * - Adding a submenu item that links to /sites.
 * - Hiding that submenu item with CSS.
 *
 * This works because the top level menu item links to wherever the submenu item links to.
 */
function wpcom_add_wpcom_menu_item() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	global $menu;

	$parent_slug = 'wpcom-hosting-menu';
	$domain      = wp_parse_url( home_url(), PHP_URL_HOST );

	add_menu_page(
		esc_attr__( 'All Sites', 'jetpack-mu-wpcom' ),
		esc_attr__( 'All Sites', 'jetpack-mu-wpcom' ),
		'manage_options',
		'https://wordpress.com/sites',
		null,
		'dashicons-arrow-left-alt2',
		0
	);

	// Position a separator below the WordPress.com menu item.
	// Inspired by https://github.com/Automattic/jetpack/blob/b6b6e86c5491869782857141ca48168dfa195635/projects/plugins/jetpack/modules/masterbar/admin-menu/class-base-admin-menu.php#L239
	$separator = array(
		'',
		'manage_options',
		wp_unique_id( 'separator-custom-' ),
		'',
		'wp-menu-separator',
	);

	$position = 0;
	if ( isset( $menu[ "$position" ] ) ) {
		$position            = $position + substr( base_convert( md5( $separator[2] . $separator[0] ), 16, 10 ), -5 ) * 0.00001;
		$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	} else {
		$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	add_menu_page(
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ) . ' <span class="dashicons dashicons-external" style="float: right;"></span>',
		'manage_options',
		$parent_slug,
		null,
		'dashicons-cloud',
		3
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/home/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/plans/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/add-ons/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/domains/manage/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/email/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/purchases/subscriptions/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Configuration', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Configuration', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/hosting-config/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Monitoring', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Monitoring', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/site-monitoring/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Monetize', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Monetize', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/earn/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Subscribers', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Subscribers', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/subscribers/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/settings/general/$domain" ),
		null
	);

	// By default, WordPress adds a submenu item for the parent menu item, which we don't want.
	remove_submenu_page(
		$parent_slug,
		$parent_slug
	);
}
add_action( 'admin_menu', 'wpcom_add_wpcom_menu_item' );
