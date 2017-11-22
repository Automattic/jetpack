<?php
/**
 * Module Name: WordPress.com Nudges
 * Module Description: Display admin tips that nudge the user to equivalent admin pages on WordPress.com.
 * Jumpstart Description: Display admin tips that nudge the user to equivalent admin pages on WordPress.com.
 * Sort Order: 15
 * Recommendation Order: 14
 * First Introduced: 5.6
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Other
 */

if ( is_admin() && Jetpack_Options::get_option( 'edit_links_calypso_redirect' ) ) {
	require_once dirname( __FILE__ ) . '/calypso-nudges/class.calypso-nudges.php';
}
