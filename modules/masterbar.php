<?php
/**
 * Module Name: WordPress.com Toolbar
 * Module Description: Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Admin_Menu;

require dirname( __FILE__ ) . '/masterbar/masterbar.php';

new A8C_WPCOM_Masterbar();

if ( apply_filters( 'jetpack_load_admin_menu_class', ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || jetpack_is_atomic_site() ) ) {
	require_once __DIR__ . '/masterbar/class-admin-menu.php';
	Admin_Menu::get_instance();
}
