<?php
/**
 * Module Name: WordPress.com Toolbar and Dashboard customizations
 * Module Description: Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com. Also adds additional customizations to the WPAdmin dashboard experience for better compatibility with WP.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar, colorschemes
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require __DIR__ . '/masterbar/masterbar/class-masterbar.php';
require __DIR__ . '/masterbar/admin-color-schemes/class-admin-color-schemes.php';

new Masterbar();
new Admin_Color_Schemes();

/**
 * Whether to load the admin menu functionality.
 *
 * @use add_filter( 'jetpack_load_admin_menu_class', '__return_true' );
 */
if ( apply_filters( 'jetpack_load_admin_menu_class', false ) ) {
	require_once __DIR__ . '/masterbar/admin-menu/class-admin-menu.php';
	Admin_Menu::get_instance();
}
