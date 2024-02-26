<?php
/**
 * Module Name: WordPress.com Toolbar and Dashboard customizations
 * Module Description: Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com. Also adds additional customizations to the WPAdmin dashboard experience for better compatibility with WP.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar, colorschemes, profile-edit
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Status\Host;

require __DIR__ . '/masterbar/masterbar/class-masterbar.php';
require __DIR__ . '/masterbar/admin-color-schemes/class-admin-color-schemes.php';
require __DIR__ . '/masterbar/inline-help/class-inline-help.php';

$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;

$should_use_nav_redesign = apply_filters( 'is_nav_redesign_enabled', $is_proxied && get_option( 'wpcom_admin_interface' ) === 'wp-admin' );

if ( ! $should_use_nav_redesign ) {
	new Masterbar();
}

new Admin_Color_Schemes();

if ( ( new Host() )->is_woa_site() ) {
	new Inline_Help();
	require_once __DIR__ . '/masterbar/wp-posts-list/bootstrap.php';
	require_once __DIR__ . '/masterbar/profile-edit/bootstrap.php';
	require_once __DIR__ . '/masterbar/nudges/bootstrap.php';
}

/**
 * Whether to load the admin menu functionality.
 *
 * @use add_filter( 'jetpack_load_admin_menu_class', '__return_true' );
 * @module masterbar
 *
 * @since 9.3.0
 *
 * @param bool $load_admin_menu_class Load Jetpack's custom admin menu functionality. Default to false.
 */
if ( ! $should_use_nav_redesign && apply_filters( 'jetpack_load_admin_menu_class', false ) ) {
	require_once __DIR__ . '/masterbar/admin-menu/load.php';
}
