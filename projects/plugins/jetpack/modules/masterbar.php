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

/**
 * Remove Masterbar from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 * We only need this function and module file until the Masterbar is fully removed from Jetpack including notices).
 *
 * @param array $items Array of Jetpack modules.
 * @return array
 */
function remove_masterbar_module_list( $items ) {
	if ( isset( $items['masterbar'] ) && get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		unset( $items['masterbar'] );
	}
	return $items;
}

add_filter( 'jetpack_modules_list_table_items', 'remove_masterbar_module_list' );
