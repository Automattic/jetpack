<?php
/**
 * Hotfixes for Nav Unification feature, due to Jetpack monthly release cycle.
 * Each hotfix should declare when it is safe to be removed.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Status;

/**
 * Fix third-party dependencies that expect index.php submenu item to be available.
 */
function wpcomsh_add_index_page_hotfix() {
	global $submenu;

	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Do not clash with the fix already shipped in Jetpack 9.6.
	if ( version_compare( JETPACK__VERSION, '9.7-alpha', '>=' ) ) {
		return;
	}

	// Safety - don't alter anything if Nav Unification is not enabled.
	if ( ! wpcomsh_activate_nav_unification( false ) ) {
		return;
	}

	add_submenu_page( 'index.php', '', '', 'read', 'index.php', '', 10 );


	foreach ( $submenu['index.php'] as $index => $item ) {
		if ( 'index.php' !== $item[2] ) {
			continue;
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['index.php'][ $index ][4] = 'hide-if-no-js hide-if-js';
	}
}

add_action( 'admin_menu', 'wpcomsh_add_index_page_hotfix', 1 );

/**
 * Deprecates gracefully Links menu item.
 * Can be removed after Jetpack 9.6 release.
 */
function wpcomsh_remove_links_manager_gracefully() {
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

	// Add the menu back in.
	add_menu_page( __( 'Links', 'wpcomsh' ), __( 'Links', 'wpcomsh' ), 'manage_links', 'link-manager.php', null, 'dashicons-admin-links', 6 );

	// The max ID number of the auto-generated links.
	$max_default_id = 10;

	$link_manager_links = get_bookmarks(
		array(
			'orderby' => 'link_id',
			'order'   => 'DESC',
			'limit'   => $max_default_id,
		)
	);

	// Ordered links by ID descending, check if the first ID is more than $max_default_id.
	if ( count( $link_manager_links ) > 0 && $link_manager_links[0]->link_id > $max_default_id ) {
		return;
	}

	// Remove the Links menu item if user has added their own Links.
	remove_menu_page( 'link-manager.php' );
}
add_action( 'admin_menu', 'wpcomsh_remove_links_manager_gracefully' );


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
	$wp_admin = get_user_option( 'jetpack_admin_menu_link_destination' );

	if ( $wp_admin ) {
		$site_domain        = ( new Status() )->get_site_suffix();
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
 * Hotfix: force Posts and Pages to point to WPAdmin on Atomic.
 * Full fix will be deployed to Jetpack in:
 * https://github.com/Automattic/jetpack/pull/19240.
 *
 * See: https://github.com/Automattic/wp-calypso/issues/51283.
 *
 * @return void
 */
function wpcomsh_force_wpadmin_posts_pages_on_atomic() {

	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Safety - don't alter anything if Nav Unification is not enabled.
	if ( ! wpcomsh_activate_nav_unification( false ) ) {
		return;
	}

	$site_domain = ( new Status() )->get_site_suffix();

	wpcomsh_update_submenus(
		'edit.php',
		array(
			'https://wordpress.com/posts/' . $site_domain => 'edit.php',
			'https://wordpress.com/post/' . $site_domain  => 'post-new.php',
		)
	);

	wpcomsh_update_submenus(
		'edit.php?post_type=page',
		array(
			'https://wordpress.com/pages/' . $site_domain => 'edit.php?post_type=page',
			'https://wordpress.com/page/' . $site_domain  => 'post-new.php?post_type=page',
		)
	);
}

add_action( 'admin_menu', 'wpcomsh_force_wpadmin_posts_pages_on_atomic', 99999999999999 );


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

/**
 * Enqueue the styles needed by nav unification on AMP requests.
 *
 * Can be removed after Jetpack 9.6 release.
 */
function wpcomsh_enqueue_admin_menu_styles() {
	// Do not run if Jetpack is disabled.
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

	$text_direction = get_user_option( 'jetpack_text_direction' );
	$is_rtl         = 'rtl' === $text_direction;
	if ( $is_rtl ) {
		$css_path = '//s0.wp.com/wp-content/mu-plugins/masterbar/admin-menu/rtl/admin-menu-rtl.css';
	} else {
		$css_path = plugins_url( 'modules/masterbar/admin-menu/admin-menu.css', JETPACK__PLUGIN_FILE );
	}

	wp_enqueue_style( 'jetpack-admin-menu', $css_path, array(), WPCOMSH_VERSION );
}
add_action( 'admin_enqueue_scripts', 'wpcomsh_enqueue_admin_menu_styles' );
