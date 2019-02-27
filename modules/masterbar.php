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
 */

require dirname( __FILE__ ) . '/masterbar/masterbar.php';

// In order to be able to tell if it's an AMP request or not we have to hook into parse_query at a later priority.
add_action( 'admin_bar_init', 'jetpack_initialize_masterbar', 99 );

/**
 * Initializes the Masterbar in case the request is not AMP.
 */
function jetpack_initialize_masterbar() {
	if ( ! Jetpack_AMP_Support::is_amp_request() ) {
		new A8C_WPCOM_Masterbar();
	}
}
