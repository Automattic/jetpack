<?php
/**
 * Module Name: Ads
 * Module Description: Earn income by allowing Jetpack to display high quality ads.
 * Sort Order: 1
 * First Introduced: 4.5.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Traffic, Appearance
 * Additional Search Queries: advertising, ad codes, ads
 */

function jetpack_load_wordads() {
	if ( Jetpack::active_plan_supports( 'wordads' ) ) {
		require_once( dirname( __FILE__ ) . "/wordads/wordads.php" );
	} else {
		Jetpack::deactivate_module( 'wordads' );
	}
}

jetpack_load_wordads();
