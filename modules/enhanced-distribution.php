<?php
/**
 * Module Name: Enhanced Distribution
 * Module Description: Share your public posts and comments to search engines and other services in real-time.
 * Sort Order: 100
 * First Introduced: 1.2
 * Requires Connection: Yes
 */

Jetpack_Sync::sync_posts( __FILE__ );
Jetpack_Sync::sync_comments( __FILE__ );

function jetpack_enhanced_distribution_activate() {
	Jetpack::check_privacy( __FILE__ );
}


// In case it's active prior to upgrading to 1.9
function jetpack_enhanced_distribution_before_activate_default_modules() {
	$old_version = Jetpack::get_option( 'old_version' );
	list( $old_version ) = explode( ':', $old_version );

	if ( version_compare( $old_version, '1.9-something', '>=' ) ) {
		return;
	}

	Jetpack::check_privacy( __FILE__ );
}

add_action( 'jetpack_activate_module_enhanced-distribution', 'jetpack_enhanced_distribution_activate' );
add_action( 'jetpack_before_activate_default_modules', 'jetpack_enhanced_distribution_before_activate_default_modules' );
